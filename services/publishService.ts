/** Publish notes as public pages at noteweb.co/p/<slug> (NoteWeb Pro). */
import { Note } from '../types';
import { getProState } from './proService';

const MAP_KEY = 'noteweb_published';

export interface PublishedInfo {
  slug: string;
  url: string;
  updated_at: number;
}

export const getPublishedMap = (): Record<string, PublishedInfo> => {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) || '{}');
  } catch {
    return {};
  }
};
const saveMap = (m: Record<string, PublishedInfo>) => {
  try {
    localStorage.setItem(MAP_KEY, JSON.stringify(m));
  } catch {
    // ignore
  }
};

const call = async (method: string, body?: unknown, query = '') => {
  const key = getProState()?.key;
  if (!key) throw new Error('Publishing needs NoteWeb Pro.');
  const res = await fetch(`/api/publish${query}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-License-Key': key },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Publishing failed (${res.status}).`);
  return data;
};

/** Published pages show plain text for [[links]] to unpublished notes, and a link for published ones. */
const prepareMarkdown = (note: Note, published: Record<string, PublishedInfo>, notesByTitle: Map<string, Note>) =>
  note.content.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_m, target: string, _p, label?: string) => {
    const linked = notesByTitle.get(target);
    const info = linked && published[linked.id];
    return info ? `[${label || target}](/p/${info.slug})` : label || target;
  });

export const publishNote = async (note: Note, allNotes: Note[]): Promise<PublishedInfo> => {
  if (note.lock) throw new Error('Unlock this note before publishing it.');
  const map = getPublishedMap();
  const byTitle = new Map(allNotes.map(n => [n.title, n]));
  const data = await call('POST', { note_id: note.id, title: note.title, markdown: prepareMarkdown(note, map, byTitle), tags: note.tags });
  map[note.id] = { slug: data.slug, url: data.url, updated_at: data.updated_at };
  saveMap(map);
  return map[note.id];
};

export const unpublishNote = async (noteId: string) => {
  await call('DELETE', undefined, `?note_id=${encodeURIComponent(noteId)}`);
  const map = getPublishedMap();
  delete map[noteId];
  saveMap(map);
};

/** Refreshes the local map from the server (e.g. after publishing on another device). */
export const refreshPublished = async () => {
  const data = await call('GET');
  const map: Record<string, PublishedInfo> = {};
  for (const p of data.pages) map[p.note_id] = { slug: p.slug, url: p.url, updated_at: p.updated_at };
  saveMap(map);
  return map;
};
