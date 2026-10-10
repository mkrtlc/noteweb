/**
 * Share a note as a self-contained link. The note is compressed into the URL
 * fragment (#...), which browsers never send to the server, so sharing stays
 * private: only people with the link can read it.
 */
import { deflateSync, inflateSync, strToU8, strFromU8 } from 'fflate';
import { Note } from '../types';

export interface SharedNote {
  t: string; // title
  c: string; // markdown content
  g: string[]; // tags
  at: number; // shared at
}

const toBase64Url = (bytes: Uint8Array) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (s: string) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
};

export const MAX_SHARE_URL = 60000;

export const buildShareUrl = (note: Note, origin = window.location.origin): string => {
  const payload: SharedNote = { t: note.title, c: note.content, g: note.tags, at: Date.now() };
  const packed = toBase64Url(deflateSync(strToU8(JSON.stringify(payload)), { level: 9 }));
  return `${origin}/share#n=${packed}`;
};

export const parseShareHash = (hash: string): SharedNote | null => {
  try {
    const m = /n=([A-Za-z0-9_-]+)/.exec(hash);
    if (!m) return null;
    const data = JSON.parse(strFromU8(inflateSync(fromBase64Url(m[1]))));
    if (typeof data.t !== 'string' || typeof data.c !== 'string') return null;
    return { t: data.t.slice(0, 500), c: data.c, g: Array.isArray(data.g) ? data.g.map(String).slice(0, 50) : [], at: Number(data.at) || 0 };
  } catch {
    return null;
  }
};
