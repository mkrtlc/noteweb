import { Note, Folder, TrashedNote, NoteSnapshot } from "../types";

// Storage keys. These are the public contract with existing users' browsers:
// never rename them without a migration.
const NOTES_KEY = 'noteweb_notes';
const FOLDERS_KEY = 'noteweb_folders';
const TRASH_KEY = 'noteweb_trash';
const HISTORY_KEY = 'noteweb_history';
const SETTINGS_KEY = 'noteweb_settings';

const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_SNAPSHOTS_PER_NOTE = 20;
const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return fallback;
  }
};

const writeJson = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    return false;
  }
};

export const hasExistingNotes = (): boolean => {
  try {
    const stored = localStorage.getItem(NOTES_KEY);
    return !!stored && stored !== '[]';
  } catch {
    return false;
  }
};

export const loadNotes = async (): Promise<Note[]> => readJson<Note[]>(NOTES_KEY, []);

export const saveNotes = async (notes: Note[]): Promise<boolean> => writeJson(NOTES_KEY, notes);

export const loadFolders = async (): Promise<Folder[]> => readJson<Folder[]>(FOLDERS_KEY, []);

export const saveFolders = async (folders: Folder[]): Promise<boolean> => writeJson(FOLDERS_KEY, folders);

// ---------- Trash ----------

export const loadTrash = (): TrashedNote[] => {
  const now = Date.now();
  return readJson<TrashedNote[]>(TRASH_KEY, []).filter(t => now - t.deletedAt < TRASH_RETENTION_MS);
};

export const saveTrash = (trash: TrashedNote[]): boolean => writeJson(TRASH_KEY, trash);

// ---------- Version history ----------

type HistoryStore = Record<string, NoteSnapshot[]>;

export const loadHistory = (noteId: string): NoteSnapshot[] =>
  (readJson<HistoryStore>(HISTORY_KEY, {})[noteId] || []).slice().sort((a, b) => b.at - a.at);

/**
 * Records a snapshot of a note if its content changed and the last snapshot
 * is older than SNAPSHOT_INTERVAL_MS (or `force` is set).
 */
export const recordSnapshot = (note: Note, force = false): void => {
  const store = readJson<HistoryStore>(HISTORY_KEY, {});
  const list = store[note.id] || [];
  const last = list[list.length - 1];
  if (last && last.content === note.content && last.title === note.title) return;
  if (!force && last && Date.now() - last.at < SNAPSHOT_INTERVAL_MS) return;
  list.push({ title: note.title, content: note.content, at: Date.now() });
  store[note.id] = list.slice(-MAX_SNAPSHOTS_PER_NOTE);
  if (!writeJson(HISTORY_KEY, store)) {
    // Storage is full: keep only the newest few snapshots per note and retry.
    Object.keys(store).forEach(id => {
      store[id] = store[id].slice(-3);
    });
    writeJson(HISTORY_KEY, store);
  }
};

export const deleteHistory = (noteId: string): void => {
  const store = readJson<HistoryStore>(HISTORY_KEY, {});
  if (store[noteId]) {
    delete store[noteId];
    writeJson(HISTORY_KEY, store);
  }
};

// ---------- Settings ----------

export interface AppSettings {
  sortMode: 'manual' | 'updated' | 'created' | 'title';
  showGraph: boolean;
  rightTab: 'graph' | 'outline' | 'links';
}

const DEFAULT_SETTINGS: AppSettings = { sortMode: 'manual', showGraph: true, rightTab: 'graph' };

export const loadSettings = (): AppSettings => ({ ...DEFAULT_SETTINGS, ...readJson<Partial<AppSettings>>(SETTINGS_KEY, {}) });

export const saveSettings = (settings: AppSettings): boolean => writeJson(SETTINGS_KEY, settings);

export const storageUsageBytes = (): number => {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('noteweb_')) total += (localStorage.getItem(key) || '').length * 2;
    }
  } catch {
    // ignore
  }
  return total;
};
