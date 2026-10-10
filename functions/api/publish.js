// Publish notes as public web pages (NoteWeb Pro).
//   GET    /api/publish              list my published notes
//   POST   /api/publish              { note_id, title, markdown, tags } -> { slug, url }
//   DELETE /api/publish?note_id=...  unpublish
import { json, requirePro } from '../../server/pro.js';

const MAX_MD = 400_000;

const slugify = title =>
  (title || 'note')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'note';

const rand = () => [...crypto.getRandomValues(new Uint8Array(4))].map(b => (b % 36).toString(36)).join('');

export async function onRequest({ request, env }) {
  const auth = await requirePro(request, env);
  if (auth.error) return auth.error;
  const { vaultId } = auth;
  const origin = new URL(request.url).origin;

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT note_id, slug, title, updated_at FROM pages WHERE vault_id = ? ORDER BY updated_at DESC').bind(vaultId).all();
    return json({ pages: results.map(p => ({ ...p, url: `${origin}/p/${p.slug}` })) });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const noteId = String(body.note_id || '').slice(0, 80);
    const title = String(body.title || 'Untitled').slice(0, 300);
    const markdown = String(body.markdown || '');
    const tags = Array.isArray(body.tags) ? body.tags.map(String).slice(0, 30) : [];
    if (!noteId) return json({ error: 'note_id is required.' }, 400);
    if (markdown.length > MAX_MD) return json({ error: 'This note is too long to publish.' }, 413);

    const now = Date.now();
    const existing = await env.DB.prepare('SELECT slug FROM pages WHERE vault_id = ? AND note_id = ?').bind(vaultId, noteId).first();
    const slug = existing ? existing.slug : `${slugify(title)}-${rand()}`;
    await env.DB.prepare(
      `INSERT INTO pages (slug, vault_id, note_id, title, markdown, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(vault_id, note_id) DO UPDATE SET title = excluded.title, markdown = excluded.markdown, tags = excluded.tags, updated_at = excluded.updated_at`
    )
      .bind(slug, vaultId, noteId, title, markdown, JSON.stringify(tags), now, now)
      .run();
    return json({ slug, url: `${origin}/p/${slug}`, updated_at: now });
  }

  if (request.method === 'DELETE') {
    const noteId = new URL(request.url).searchParams.get('note_id') || '';
    await env.DB.prepare('DELETE FROM pages WHERE vault_id = ? AND note_id = ?').bind(vaultId, noteId).run();
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
}
