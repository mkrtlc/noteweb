/** Publish notes as public pages at noteweb.co/p/<slug> (NoteWeb Pro). */
import { Note } from '../types';
import { getProState } from './proService';
import { b64, unb64, randomBytes, deriveAesKey, encryptText, decryptText, CHECK_PHRASE } from './cryptoUtils';

const MAP_KEY = 'noteweb_published';

export interface PublishedInfo {
  slug: string;
  url: string;
  updated_at: number;
  protected?: boolean;
  burn?: boolean;
  expires_at?: number | null;
}

export interface PublishOptions {
  /** Readers must enter this password; the note is encrypted in the browser before upload. */
  password?: string;
  /** The page is deleted after it is opened once. */
  burn?: boolean;
  /** 0 = never expires, -1 keeps the current expiry when republishing. */
  expiresInDays?: number;
}

export interface SiteInfo {
  handle: string;
  title: string;
  bio: string;
}

export interface EncryptedPage {
  salt: string;
  check_iv: string;
  check_ct: string;
  iv: string;
  ct: string;
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

const call = async (method: string, body?: unknown, query = '', path = '/api/publish') => {
  const key = getProState()?.key;
  if (!key) throw new Error('Publishing needs NoteWeb Pro.');
  const res = await fetch(`${path}${query}`, {
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

/** Encrypts a page for password-protected publishing. Same scheme as sync: PBKDF2 → AES-GCM-256. */
export const encryptPage = async (password: string, page: { title: string; markdown: string; tags: string[] }): Promise<EncryptedPage> => {
  const salt = randomBytes(16);
  const key = await deriveAesKey(password, salt);
  const check = await encryptText(key, CHECK_PHRASE);
  const body = await encryptText(key, JSON.stringify(page));
  return { salt: b64(salt), check_iv: check.iv, check_ct: check.ct, iv: body.iv, ct: body.ct };
};

/** Returns the key if the password is right, otherwise null. */
export const unlockPage = async (password: string, c: Pick<EncryptedPage, 'salt' | 'check_iv' | 'check_ct'>): Promise<CryptoKey | null> => {
  const key = await deriveAesKey(password, unb64(c.salt));
  try {
    return (await decryptText(key, c.check_iv, c.check_ct)) === CHECK_PHRASE ? key : null;
  } catch {
    return null;
  }
};

export const decryptPage = async (key: CryptoKey, c: Pick<EncryptedPage, 'iv' | 'ct'>) =>
  JSON.parse(await decryptText(key, c.iv, c.ct)) as { title: string; markdown: string; tags: string[] };

export const publishNote = async (note: Note, allNotes: Note[], options: PublishOptions = {}): Promise<PublishedInfo> => {
  if (note.lock) throw new Error('Unlock this note before publishing it.');
  const map = getPublishedMap();
  const byTitle = new Map(allNotes.map(n => [n.title, n]));
  const page = { title: note.title, markdown: prepareMarkdown(note, map, byTitle), tags: note.tags };
  const body: Record<string, unknown> = { note_id: note.id, burn: !!options.burn, expires_in_days: options.expiresInDays || 0 };
  if (options.password) body.protected = await encryptPage(options.password, page);
  else Object.assign(body, page);
  const data = await call('POST', body);
  map[note.id] = { slug: data.slug, url: data.url, updated_at: data.updated_at, protected: data.protected, burn: data.burn, expires_at: data.expires_at };
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
  for (const p of data.pages)
    map[p.note_id] = { slug: p.slug, url: p.url, updated_at: p.updated_at, protected: p.protected, burn: p.burn, expires_at: p.expires_at };
  saveMap(map);
  return map;
};

export const getSite = async (): Promise<SiteInfo | null> => (await call('GET', undefined, '', '/api/site')).site;
export const saveSite = async (site: SiteInfo): Promise<SiteInfo> => (await call('POST', site, '', '/api/site')).site;
export const removeSite = async () => {
  await call('DELETE', undefined, '', '/api/site');
};
