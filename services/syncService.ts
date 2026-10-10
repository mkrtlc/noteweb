/**
 * NoteWeb Pro encrypted sync.
 *
 * Every note and folder is encrypted in the browser with a key derived from the
 * user's sync passphrase (PBKDF2 → AES-GCM 256) before it is sent. The server
 * stores ciphertext keyed by the Polar customer, so it can't read notes and a
 * renewed subscription keeps the same vault. Conflicts resolve per note by
 * last edit (updatedAt); the losing local version is kept in version history,
 * and remote deletions move local notes to the trash instead of erasing them.
 */
import { Note, Folder } from '../types';
import { getProState } from './proService';
import { idbGet, idbSet, idbDel } from '../utils/idb';
import { b64, unb64, randomBytes, deriveAesKey, encryptText, decryptText, CHECK_PHRASE } from './cryptoUtils';

const CONFIG_KEY = 'noteweb_sync';
const STATE_KEY = 'noteweb_sync_state';
const IDB_KEY = 'sync-key';
const PUSH_CHUNK = 50;

export interface SyncConfig {
  enabled: boolean;
  cursor: number;
  lastSyncAt: number;
  lastError: string | null;
}

interface SyncState {
  notes: Record<string, number>; // id -> updatedAt known to be on the server
  folders: Record<string, string>; // id -> JSON known to be on the server
}

interface RemoteItem {
  item_id: string;
  kind: 'note' | 'folder';
  iv: string | null;
  ct: string | null;
  deleted: number;
  updated_at: number;
  seq: number;
}

export interface SyncResult {
  upsertNotes: Note[];
  deleteNoteIds: { id: string; at: number }[];
  upsertFolders: Folder[];
  deleteFolderIds: string[];
  pushed: number;
  pulled: number;
}

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? { ...fallback, ...JSON.parse(v) } : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // ignore
  }
};

export const getSyncConfig = (): SyncConfig => read<SyncConfig>(CONFIG_KEY, { enabled: false, cursor: 0, lastSyncAt: 0, lastError: null });
const saveConfig = (c: SyncConfig) => {
  write(CONFIG_KEY, c);
  window.dispatchEvent(new Event('noteweb-sync-changed'));
};
const getState = (): SyncState => read<SyncState>(STATE_KEY, { notes: {}, folders: {} });
const saveState = (s: SyncState) => write(STATE_KEY, s);

class SyncError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}

const api = async (path: string, init: RequestInit = {}) => {
  const key = getProState()?.key;
  if (!key) throw new SyncError('NoteWeb Pro is not active on this device.', 401);
  let res: Response;
  try {
    res = await fetch(`/api/sync/${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'X-License-Key': key, ...(init.headers || {}) },
    });
  } catch {
    throw new SyncError("You're offline. Changes will sync when you're back online.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new SyncError(data.error || `Sync failed (${res.status}).`, res.status);
  return data;
};

const loadKey = () => idbGet<CryptoKey>(IDB_KEY);

/** Sets up sync on this device. Creates the vault if it doesn't exist yet. */
export const setupSync = async (passphrase: string, beforeEnable?: (created: boolean) => Promise<void> | void): Promise<{ created: boolean }> => {
  if (passphrase.length < 8) throw new SyncError('Use at least 8 characters for your sync passphrase.');
  let vault: { exists: boolean; salt?: string; check_iv?: string; check_ct?: string } | null = null;
  try {
    vault = await api('vault');
  } catch (e) {
    if ((e as SyncError).status !== 404) throw e;
  }
  let key: CryptoKey;
  let created = false;
  if (vault?.exists && vault.salt && vault.check_iv && vault.check_ct) {
    key = await deriveAesKey(passphrase, unb64(vault.salt));
    try {
      const check = await decryptText(key, vault.check_iv, vault.check_ct);
      if (check !== CHECK_PHRASE) throw new Error('mismatch');
    } catch {
      throw new SyncError("That passphrase doesn't match your sync vault.");
    }
  } else {
    const salt = randomBytes(16);
    key = await deriveAesKey(passphrase, salt);
    const check = await encryptText(key, CHECK_PHRASE);
    await api('vault', { method: 'POST', body: JSON.stringify({ salt: b64(salt), check_iv: check.iv, check_ct: check.ct }) });
    created = true;
  }
  // Runs only after the passphrase is verified (e.g. replacing this device's notes).
  await beforeEnable?.(created);
  await idbSet(IDB_KEY, key);
  saveState({ notes: {}, folders: {} });
  saveConfig({ enabled: true, cursor: 0, lastSyncAt: 0, lastError: null });
  return { created };
};

/** Does the license already have a vault? (decides "set a passphrase" vs "enter your passphrase") */
export const vaultExists = async (): Promise<boolean> => {
  try {
    const v = await api('vault');
    return !!v.exists;
  } catch (e) {
    if ((e as SyncError).status === 404) return false;
    throw e;
  }
};

export const disableSync = async () => {
  await idbDel(IDB_KEY);
  saveState({ notes: {}, folders: {} });
  saveConfig({ enabled: false, cursor: 0, lastSyncAt: 0, lastError: null });
};

/** Erases the server vault (e.g. forgotten passphrase). Local notes are untouched. */
export const eraseVault = async () => {
  await api('vault', { method: 'DELETE' });
  await disableSync();
};

const decryptItem = async <T,>(key: CryptoKey, item: RemoteItem): Promise<T> => JSON.parse(await decryptText(key, item.iv!, item.ct!));

/**
 * One sync round: pull remote changes since the cursor, decide what to apply
 * locally, then push local changes. The caller applies the returned changes
 * with functional state updates (so edits made meanwhile are not lost).
 */
export const runSync = async (local: { notes: Note[]; folders: Folder[]; trashedIds: Set<string> }): Promise<SyncResult> => {
  const config = getSyncConfig();
  if (!config.enabled) throw new SyncError('Sync is off.');
  const key = await loadKey();
  if (!key) {
    saveConfig({ ...config, enabled: false, lastError: 'Enter your sync passphrase again on this device.' });
    throw new SyncError('Enter your sync passphrase again on this device.');
  }
  const state = getState();
  const result: SyncResult = { upsertNotes: [], deleteNoteIds: [], upsertFolders: [], deleteFolderIds: [], pushed: 0, pulled: 0 };
  const localNotes = new Map(local.notes.map(n => [n.id, n]));
  const localFolders = new Map(local.folders.map(f => [f.id, f]));

  try {
    // ---- Pull ----
    let cursor = config.cursor;
    for (let page = 0; page < 50; page++) {
      const data = await api(`pull?since=${cursor}`);
      for (const item of data.items as RemoteItem[]) {
        result.pulled++;
        if (item.kind === 'note') {
          const mine = localNotes.get(item.item_id);
          if (item.deleted) {
            if (mine && mine.updatedAt <= item.updated_at) {
              result.deleteNoteIds.push({ id: item.item_id, at: item.updated_at });
              localNotes.delete(item.item_id);
            }
            if (!mine || mine.updatedAt <= item.updated_at) delete state.notes[item.item_id];
            continue;
          }
          const remote = await decryptItem<Note>(key, item);
          if (local.trashedIds.has(remote.id) && !mine && state.notes[remote.id] !== undefined) {
            // Deleted here after it was last synced: our tombstone will be pushed below.
            continue;
          }
          if (!mine || mine.updatedAt < remote.updatedAt) {
            result.upsertNotes.push(remote);
            localNotes.set(remote.id, remote);
            state.notes[remote.id] = remote.updatedAt;
          } else if (mine.updatedAt === remote.updatedAt) {
            state.notes[remote.id] = remote.updatedAt;
          }
        } else {
          if (item.deleted) {
            if (localFolders.has(item.item_id)) result.deleteFolderIds.push(item.item_id);
            localFolders.delete(item.item_id);
            delete state.folders[item.item_id];
            continue;
          }
          const remote = await decryptItem<Folder>(key, item);
          const json = JSON.stringify(remote);
          if (JSON.stringify(localFolders.get(remote.id) || null) !== json) {
            result.upsertFolders.push(remote);
            localFolders.set(remote.id, remote);
          }
          state.folders[remote.id] = json;
        }
      }
      cursor = data.cursor;
      if (!data.more) break;
    }

    // ---- Push ----
    const outgoing: { item: Record<string, unknown>; apply: () => void }[] = [];
    for (const note of localNotes.values()) {
      if (state.notes[note.id] === note.updatedAt) continue;
      const enc = await encryptText(key, JSON.stringify(note));
      outgoing.push({
        item: { item_id: note.id, kind: 'note', iv: enc.iv, ct: enc.ct, deleted: false, updated_at: note.updatedAt },
        apply: () => (state.notes[note.id] = note.updatedAt),
      });
    }
    for (const id of Object.keys(state.notes)) {
      if (!localNotes.has(id)) {
        outgoing.push({ item: { item_id: id, kind: 'note', deleted: true, updated_at: Date.now() }, apply: () => delete state.notes[id] });
      }
    }
    for (const folder of localFolders.values()) {
      const json = JSON.stringify(folder);
      if (state.folders[folder.id] === json) continue;
      const enc = await encryptText(key, json);
      outgoing.push({
        item: { item_id: folder.id, kind: 'folder', iv: enc.iv, ct: enc.ct, deleted: false, updated_at: Date.now() },
        apply: () => (state.folders[folder.id] = json),
      });
    }
    for (const id of Object.keys(state.folders)) {
      if (!localFolders.has(id)) {
        outgoing.push({ item: { item_id: id, kind: 'folder', deleted: true, updated_at: Date.now() }, apply: () => delete state.folders[id] });
      }
    }
    for (let i = 0; i < outgoing.length; i += PUSH_CHUNK) {
      const chunk = outgoing.slice(i, i + PUSH_CHUNK);
      const data = await api('push', { method: 'POST', body: JSON.stringify({ items: chunk.map(c => c.item) }) });
      const accepted = new Set<string>(data.accepted);
      chunk.forEach(c => {
        if (accepted.has(c.item.item_id as string)) {
          c.apply();
          result.pushed++;
        }
      });
    }

    saveState(state);
    saveConfig({ ...getSyncConfig(), cursor, lastSyncAt: Date.now(), lastError: null });
    return result;
  } catch (e) {
    saveState(state);
    saveConfig({ ...getSyncConfig(), lastError: (e as Error).message });
    throw e;
  }
};
