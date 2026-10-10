/**
 * Export / import / encrypted backups. Everything runs in the browser:
 * nothing is uploaded anywhere.
 */
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { v4 as uuidv4 } from 'uuid';
import { Note, Folder } from '../types';
import { markdownToHtml } from '../utils/markdownParser';

export interface BackupPayload {
  app: 'noteweb';
  version: 1;
  exportedAt: number;
  notes: Note[];
  folders: Folder[];
}

const ENCRYPTED_MAGIC = 'NOTEWEB-ENCRYPTED-1';

const safeName = (name: string) =>
  name.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Untitled';

/** Today's date in the user's time zone (toISOString would give the UTC date). */
const stamp = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const buildPayload = (notes: Note[], folders: Folder[]): BackupPayload => ({
  app: 'noteweb',
  version: 1,
  exportedAt: Date.now(),
  notes,
  folders,
});

/** Markdown files in folders, plus a JSON manifest for lossless re-import. Obsidian-compatible. */
export const exportMarkdownZip = (notes: Note[], folders: Folder[]) => {
  const files: Record<string, Uint8Array> = {};
  const used = new Set<string>();
  const folderName = new Map(folders.map(f => [f.id, safeName(f.name)]));
  for (const note of notes) {
    const dir = note.folderId && folderName.has(note.folderId) ? `${folderName.get(note.folderId)}/` : '';
    let path = `NoteWeb/${dir}${safeName(note.title)}.md`;
    let i = 2;
    while (used.has(path.toLowerCase())) path = `NoteWeb/${dir}${safeName(note.title)} (${i++}).md`;
    used.add(path.toLowerCase());
    const front = note.tags.length ? `---\ntags: [${note.tags.join(', ')}]\n---\n\n` : '';
    files[path] = strToU8(front + note.content);
  }
  files['NoteWeb/.noteweb-backup.json'] = strToU8(JSON.stringify(buildPayload(notes, folders)));
  const zipped = zipSync(files, { level: 6 });
  downloadBlob(new Blob([zipped], { type: 'application/zip' }), `noteweb-${stamp()}.zip`);
};

export const exportJson = (notes: Note[], folders: Folder[]) => {
  const blob = new Blob([JSON.stringify(buildPayload(notes, folders), null, 2)], { type: 'application/json' });
  downloadBlob(blob, `noteweb-backup-${stamp()}.json`);
};

export const exportSingleMarkdown = (note: Note) => {
  downloadBlob(new Blob([note.content], { type: 'text/markdown' }), `${safeName(note.title)}.md`);
};

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Standalone HTML for a note: no editor attributes, readable styles inline. */
const noteHtmlDocument = (title: string, markdown: string, forWord: boolean) => {
  const div = document.createElement('div');
  div.innerHTML = markdownToHtml(markdown);
  div.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
  div.querySelectorAll('li.task-item').forEach(el => el.prepend(document.createTextNode(el.getAttribute('data-done') === 'true' ? '☑ ' : '☐ ')));
  // The editor stores list items as flat siblings; wrap runs of them in real lists so Word numbers them correctly.
  [...div.children].forEach(el => {
    const kind = el.classList.contains('numbered-item') ? 'ol' : el.classList.contains('bullet-item') || el.classList.contains('task-item') ? 'ul' : null;
    if (!kind) return;
    const prev = el.previousElementSibling;
    if (prev && prev.tagName.toLowerCase() === kind && prev.getAttribute('data-run') === '1') prev.appendChild(el);
    else {
      const list = document.createElement(kind);
      list.setAttribute('data-run', '1');
      el.replaceWith(list);
      list.appendChild(el);
    }
  });
  div.querySelectorAll('[data-run]').forEach(el => el.removeAttribute('data-run'));
  const css = `body{font-family:${forWord ? 'Calibri,Arial' : '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif'};max-width:720px;margin:40px auto;padding:0 16px;line-height:1.65;color:#1f2330}
h1,h2,h3{line-height:1.25}pre{background:#f4f5f7;padding:12px;overflow:auto}code{font-family:Menlo,Consolas,monospace;font-size:.92em}
blockquote{border-left:3px solid #c9ccd4;margin:0;padding-left:14px;color:#555b6a}table{border-collapse:collapse}td,th{border:1px solid #d9dbe1;padding:6px 10px}a{color:#4a48b8}li.task-item{list-style:none}li.task-item[data-done="true"]{color:#8a8e9b;text-decoration:line-through}`;
  const ns = forWord ? ' xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"' : ' lang="en"';
  return `<!doctype html><html${ns}><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${css}</style></head><body><h1>${escapeHtml(title)}</h1>${div.innerHTML}</body></html>`;
};

/** NoteWeb Pro: a single note as a web page. */
export const exportNoteHtml = (title: string, markdown: string) =>
  downloadBlob(new Blob([noteHtmlDocument(title, markdown, false)], { type: 'text/html' }), `${safeName(title)}.html`);

/** NoteWeb Pro: a single note as a Word document (HTML-based .doc that Word, Pages and Google Docs open). */
export const exportNoteWord = (title: string, markdown: string) =>
  downloadBlob(new Blob(['\ufeff', noteHtmlDocument(title, markdown, true)], { type: 'application/msword' }), `${safeName(title)}.doc`);

// ---------- Encryption (AES-GCM 256, PBKDF2-SHA256 310k iterations) ----------

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

const deriveKey = async (password: string, salt: Uint8Array) => {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 310_000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const exportEncrypted = async (notes: Note[], folders: Folder[], password: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plain = new TextEncoder().encode(JSON.stringify(buildPayload(notes, folders)));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  // Chunked base64 to avoid call-stack limits on large vaults.
  let data = '';
  for (let i = 0; i < cipher.length; i += 0x8000) data += String.fromCharCode(...cipher.subarray(i, i + 0x8000));
  const file = JSON.stringify({ magic: ENCRYPTED_MAGIC, salt: b64(salt), iv: b64(iv), data: btoa(data) });
  downloadBlob(new Blob([file], { type: 'application/octet-stream' }), `noteweb-${stamp()}.nwvault`);
};

const decryptPayload = async (text: string, password: string): Promise<BackupPayload> => {
  const parsed = JSON.parse(text);
  const key = await deriveKey(password, unb64(parsed.salt));
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(parsed.iv) }, key, unb64(parsed.data));
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    throw new Error('Wrong password, or the file is damaged.');
  }
};

// ---------- Import ----------

export interface ImportResult {
  notes: Note[];
  folders: Folder[];
}

export class PasswordRequiredError extends Error {
  constructor(public fileText: string) {
    super('This backup is encrypted.');
  }
}

const parseFrontMatterTags = (md: string): { body: string; tags: string[] } => {
  const m = /^---\n([\s\S]*?)\n---\n*/.exec(md);
  if (!m) return { body: md, tags: [] };
  const tagLine = /tags:\s*\[?([^\]\n]*)\]?/.exec(m[1]);
  const tags = tagLine ? tagLine[1].split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean) : [];
  return { body: md.slice(m[0].length), tags };
};

const noteFromMarkdown = (path: string, md: string, folderId: string | null, order: number): Note => {
  const fileName = path.split('/').pop() || 'Untitled.md';
  const { body, tags } = parseFrontMatterTags(md);
  return {
    id: uuidv4(),
    title: fileName.replace(/\.(md|markdown|txt)$/i, ''),
    content: body,
    tags,
    folderId,
    order,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

const fromPayload = (payload: BackupPayload): ImportResult => {
  if (!payload || payload.app !== 'noteweb' || !Array.isArray(payload.notes)) {
    throw new Error('This file is not a NoteWeb backup.');
  }
  return { notes: payload.notes, folders: payload.folders || [] };
};

const fromMarkdownFiles = (files: { path: string; text: string }[]): ImportResult => {
  const folders: Folder[] = [];
  const folderByName = new Map<string, string>();
  const notes = files.map((f, i) => {
    const parts = f.path.split('/').filter(Boolean);
    // Use the immediate parent directory as the folder (NoteWeb has one level).
    const parent = parts.length > 1 ? parts[parts.length - 2] : null;
    let folderId: string | null = null;
    if (parent && parent !== 'NoteWeb') {
      if (!folderByName.has(parent)) {
        const id = uuidv4();
        folderByName.set(parent, id);
        folders.push({ id, name: parent, createdAt: Date.now() });
      }
      folderId = folderByName.get(parent)!;
    }
    return noteFromMarkdown(f.path, f.text, folderId, i);
  });
  return { notes, folders };
};

/** Reads user-selected files (.md, .txt, .json, .zip, .nwvault). */
export const readImportFiles = async (fileList: FileList | File[], password?: string): Promise<ImportResult> => {
  const files = Array.from(fileList);
  const md: { path: string; text: string }[] = [];
  const result: ImportResult = { notes: [], folders: [] };
  const merge = (r: ImportResult) => {
    result.notes.push(...r.notes);
    result.folders.push(...r.folders);
  };

  for (const file of files) {
    const name = file.name.toLowerCase();
    const relPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    if (name.endsWith('.zip')) {
      const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
      const manifest = Object.keys(entries).find(k => k.endsWith('.noteweb-backup.json'));
      if (manifest) {
        merge(fromPayload(JSON.parse(strFromU8(entries[manifest]))));
      } else {
        Object.entries(entries)
          .filter(([p]) => /\.(md|markdown|txt)$/i.test(p) && !p.startsWith('__MACOSX'))
          .forEach(([p, data]) => md.push({ path: p, text: strFromU8(data) }));
      }
    } else if (name.endsWith('.nwvault')) {
      const text = await file.text();
      if (!password) throw new PasswordRequiredError(text);
      merge(fromPayload(await decryptPayload(text, password)));
    } else if (name.endsWith('.json')) {
      merge(fromPayload(JSON.parse(await file.text())));
    } else if (/\.(md|markdown|txt)$/i.test(name)) {
      md.push({ path: relPath, text: await file.text() });
    }
  }
  if (md.length) merge(fromMarkdownFiles(md));
  return result;
};

export const decryptVaultText = async (text: string, password: string): Promise<ImportResult> =>
  fromPayload(await decryptPayload(text, password));

/**
 * Merges imported data into the current vault. Notes with an existing id are
 * replaced only when the imported copy is newer; everything else is added.
 */
export const mergeImport = (
  current: { notes: Note[]; folders: Folder[] },
  incoming: ImportResult
): { notes: Note[]; folders: Folder[]; added: number; updated: number } => {
  const folders = [...current.folders];
  const folderIds = new Set(folders.map(f => f.id));
  incoming.folders.forEach(f => {
    if (!folderIds.has(f.id)) {
      folders.push(f);
      folderIds.add(f.id);
    }
  });
  const byId = new Map(current.notes.map(n => [n.id, n]));
  let added = 0;
  let updated = 0;
  const maxOrder = Math.max(0, ...current.notes.map(n => n.order || 0));
  incoming.notes.forEach((n, i) => {
    const existing = byId.get(n.id);
    if (!existing) {
      byId.set(n.id, { ...n, folderId: n.folderId && folderIds.has(n.folderId) ? n.folderId : null, order: maxOrder + 1 + i });
      added++;
    } else if ((n.updatedAt || 0) > (existing.updatedAt || 0)) {
      byId.set(n.id, n);
      updated++;
    }
  });
  return { notes: Array.from(byId.values()), folders, added, updated };
};
