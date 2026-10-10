import { useCallback, useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import { Note, Folder, TrashedNote } from '../types';
import { getSyncConfig, runSync, SyncConfig } from '../services/syncService';
import { recordSnapshot } from '../services/storageService';

interface Args {
  ready: boolean;
  pro: boolean;
  notes: Note[];
  folders: Folder[];
  trash: TrashedNote[];
  setNotes: Dispatch<SetStateAction<Note[]>>;
  setFolders: Dispatch<SetStateAction<Folder[]>>;
  setTrash: Dispatch<SetStateAction<TrashedNote[]>>;
}

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'error';

/** Runs encrypted sync on load, every 45s, shortly after edits, and when the tab regains focus. */
export const useSync = ({ ready, pro, notes, folders, trash, setNotes, setFolders, setTrash }: Args) => {
  const [config, setConfig] = useState<SyncConfig>(getSyncConfig);
  const [status, setStatus] = useState<SyncStatus>(config.enabled ? 'idle' : 'off');
  const running = useRef(false);
  const latest = useRef({ notes, folders, trash });
  latest.current = { notes, folders, trash };

  useEffect(() => {
    const onChange = () => {
      const c = getSyncConfig();
      setConfig(c);
      if (!c.enabled) setStatus('off');
      else if (!running.current) setStatus(c.lastError ? 'error' : 'idle');
    };
    window.addEventListener('noteweb-sync-changed', onChange);
    return () => window.removeEventListener('noteweb-sync-changed', onChange);
  }, []);

  const syncNow = useCallback(async () => {
    if (!ready || !pro || running.current || !getSyncConfig().enabled) return;
    running.current = true;
    setStatus('syncing');
    try {
      const { notes: n, folders: f, trash: t } = latest.current;
      const r = await runSync({ notes: n, folders: f, trashedIds: new Set(t.map(x => x.note.id)) });

      if (r.upsertNotes.length || r.deleteNoteIds.length) {
        const deleted = new Map(r.deleteNoteIds.map(d => [d.id, d.at]));
        const incoming = new Map(r.upsertNotes.map(x => [x.id, x]));
        // Side effects (history snapshots, trash) are computed once, outside the state updater.
        const current = latest.current.notes;
        current.forEach(note => {
          const remote = incoming.get(note.id);
          if (remote && remote.updatedAt > note.updatedAt && (remote.content !== note.content || remote.title !== note.title)) {
            recordSnapshot(note, true);
          }
        });
        const toTrash: TrashedNote[] = current
          .filter(note => deleted.has(note.id) && note.updatedAt <= (deleted.get(note.id) as number))
          .map(note => ({ note, deletedAt: Date.now() }));

        setNotes(prev => {
          const seen = new Set<string>();
          const next = prev
            .filter(note => !(deleted.has(note.id) && note.updatedAt <= (deleted.get(note.id) as number)))
            .map(note => {
              const remote = incoming.get(note.id);
              if (!remote) return note;
              seen.add(note.id);
              return remote.updatedAt > note.updatedAt ? remote : note;
            });
          const added = r.upsertNotes.filter(x => !seen.has(x.id) && !prev.some(p => p.id === x.id));
          return added.length ? [...added, ...next] : next;
        });
        // A note restored or re-created elsewhere leaves this device's trash.
        setTrash(prev => {
          const kept = prev.filter(x => !incoming.has(x.note.id) && !toTrash.some(y => y.note.id === x.note.id));
          return kept.length === prev.length && !toTrash.length ? prev : [...kept, ...toTrash];
        });
      }
      if (r.upsertFolders.length || r.deleteFolderIds.length) {
        const incoming = new Map(r.upsertFolders.map(x => [x.id, x]));
        const removed = new Set(r.deleteFolderIds);
        setFolders(prev => {
          const next = prev.filter(x => !removed.has(x.id)).map(x => incoming.get(x.id) || x);
          const added = r.upsertFolders.filter(v => !next.some(x => x.id === v.id));
          return [...next, ...added];
        });
        if (removed.size) setNotes(prev => prev.map(n => (n.folderId && removed.has(n.folderId) ? { ...n, folderId: null } : n)));
      }
      setStatus('idle');
    } catch {
      setStatus(getSyncConfig().enabled ? 'error' : 'off');
    } finally {
      running.current = false;
      setConfig(getSyncConfig());
    }
  }, [ready, pro, setNotes, setFolders, setTrash]);

  // Initial + periodic + focus/online
  useEffect(() => {
    if (!ready || !pro || !config.enabled) return;
    syncNow();
    const t = setInterval(syncNow, 45_000);
    const onFocus = () => document.visibilityState === 'visible' && syncNow();
    window.addEventListener('online', syncNow);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener('online', syncNow);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [ready, pro, config.enabled, syncNow]);

  // Soon after local edits
  useEffect(() => {
    if (!ready || !pro || !config.enabled) return;
    const t = setTimeout(syncNow, 4000);
    return () => clearTimeout(t);
  }, [notes, folders, ready, pro, config.enabled, syncNow]);

  return { status, config, syncNow };
};
