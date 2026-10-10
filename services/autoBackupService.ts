/**
 * Automatic daily backups to a folder on the user's computer (NoteWeb Pro).
 * Uses the File System Access API (Chrome, Edge, Brave, Arc). The folder
 * handle is kept in IndexedDB; the browser may ask to re-allow access after a
 * restart, which needs one click.
 */
import { Note, Folder } from '../types';
import { idbGet, idbSet, idbDel } from '../utils/idb';
import { markBackupDone } from './storageService';

const HANDLE_KEY = 'backup-dir';
const META_KEY = 'noteweb_autobackup';
const DAY = 24 * 60 * 60 * 1000;
const KEEP = 14;

type DirHandle = FileSystemDirectoryHandle & {
  queryPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>;
  values?: () => AsyncIterable<FileSystemHandle>;
};

interface Meta {
  enabled: boolean;
  folderName: string;
  lastBackupAt: number;
}

export const isAutoBackupSupported = () => typeof window !== 'undefined' && 'showDirectoryPicker' in window;

export const getAutoBackupMeta = (): Meta => {
  try {
    return { enabled: false, folderName: '', lastBackupAt: 0, ...JSON.parse(localStorage.getItem(META_KEY) || '{}') };
  } catch {
    return { enabled: false, folderName: '', lastBackupAt: 0 };
  }
};
const saveMeta = (m: Meta) => {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('noteweb-autobackup-changed'));
};

export const chooseBackupFolder = async () => {
  const picker = (window as unknown as { showDirectoryPicker: (o: object) => Promise<DirHandle> }).showDirectoryPicker;
  const handle = await picker({ id: 'noteweb-backups', mode: 'readwrite' });
  await idbSet(HANDLE_KEY, handle);
  saveMeta({ ...getAutoBackupMeta(), enabled: true, folderName: handle.name });
  return handle.name;
};

export const disableAutoBackup = async () => {
  await idbDel(HANDLE_KEY);
  saveMeta({ enabled: false, folderName: '', lastBackupAt: getAutoBackupMeta().lastBackupAt });
};

/** 'granted' | 'prompt' | 'denied' | 'missing' */
export const backupFolderPermission = async (): Promise<string> => {
  const handle = await idbGet<DirHandle>(HANDLE_KEY);
  if (!handle) return 'missing';
  return (await handle.queryPermission?.({ mode: 'readwrite' })) || 'granted';
};

/** Must be called from a click (browsers require a user gesture to re-grant access). */
export const regrantBackupFolder = async () => {
  const handle = await idbGet<DirHandle>(HANDLE_KEY);
  if (!handle) return false;
  return (await handle.requestPermission?.({ mode: 'readwrite' })) === 'granted';
};

export const runAutoBackup = async (notes: Note[], folders: Folder[], force = false): Promise<'written' | 'skipped' | 'needs-permission' | 'off'> => {
  const meta = getAutoBackupMeta();
  if (!meta.enabled) return 'off';
  if (!force && Date.now() - meta.lastBackupAt < DAY) return 'skipped';
  const handle = await idbGet<DirHandle>(HANDLE_KEY);
  if (!handle) return 'off';
  if ((await handle.queryPermission?.({ mode: 'readwrite' })) !== 'granted') return 'needs-permission';

  // Local time, so the file name matches the user's clock (sorts correctly: YYYY-MM-DD-HH-MM).
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}`;
  const file = await handle.getFileHandle(`noteweb-backup-${stamp}.json`, { create: true });
  const w = await file.createWritable();
  await w.write(JSON.stringify({ app: 'noteweb', version: 1, exportedAt: Date.now(), notes, folders }, null, 2));
  await w.close();

  // Keep the most recent KEEP backups.
  if (handle.values) {
    const names: string[] = [];
    for await (const entry of handle.values()) {
      if (entry.kind === 'file' && /^noteweb-backup-.*\.json$/.test(entry.name)) names.push(entry.name);
    }
    names.sort().reverse();
    for (const old of names.slice(KEEP)) await handle.removeEntry(old).catch(() => undefined);
  }
  saveMeta({ ...meta, lastBackupAt: Date.now() });
  markBackupDone();
  return 'written';
};
