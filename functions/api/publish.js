// Publish notes as public web pages (NoteWeb Pro).
//   GET    /api/publish              list my published notes
//   POST   /api/publish              { note_id, title, markdown, tags, protected?, burn?, expires_in_days? } -> { slug, url }
//   DELETE /api/publish?note_id=...  unpublish
// Password-protected pages arrive already encrypted in the browser ({ salt, check_iv, check_ct, iv, ct });
// the server stores the ciphertext and never sees the password or the text.
import { json, requirePro } from '../../server/pro.js';

const MAX_MD = 400_000;
const MAX_DAYS = 365;
const B64 = /^[A-Za-z0-9+/=]+$/;

const slugify = title =>
  (title || 'note')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'note';

const rand = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => (b % 36).toString(36)).join('');

const validCipher = p =>
  p &&
  ['salt', 'check_iv', 'check_ct', 'iv', 'ct'].every(k => typeof p[k] === 'string' && p[k].length > 0 && B64.test(p[k])) &&
  p.ct.length <= MAX_MD * 1.5;

export async function onRequest({ request, env }) {
  const auth = await requirePro(request, env);
  if (auth.error) return auth.error;
  const { vaultId } = auth;
  const origin = new URL(request.url).origin;

  if (request.method === 'GET') {
    const now = Date.now();
    const { results } = await env.DB.prepare(
      'SELECT note_id, slug, title, updated_at, protected, burn, expires_at FROM pages WHERE vault_id = ? ORDER BY updated_at DESC'
    )
      .bind(vaultId)
      .all();
    const pages = results
      .filter(p => !p.expires_at || p.expires_at > now)
      .map(p => ({ ...p, protected: !!p.protected, burn: !!p.burn, url: `${origin}/p/${p.slug}` }));
    return json({ pages });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const noteId = String(body.note_id || '').slice(0, 80);
    const isProtected = !!body.protected;
    const burn = !!body.burn;
    const days = Math.floor(Number(body.expires_in_days) || 0); // -1 keeps the current expiry
    if (!noteId) return json({ error: 'note_id is required.' }, 400);
    if (days < -1 || days > MAX_DAYS) return json({ error: 'Invalid expiry.' }, 400);

    let title, markdown, tags;
    if (isProtected) {
      if (!validCipher(body.protected)) return json({ error: 'Invalid encrypted page.' }, 400);
      const { salt, check_iv, check_ct, iv, ct } = body.protected;
      title = 'Protected note';
      markdown = JSON.stringify({ v: 1, salt, check_iv, check_ct, iv, ct });
      tags = [];
    } else {
      title = String(body.title || 'Untitled').slice(0, 300);
      markdown = String(body.markdown || '');
      tags = Array.isArray(body.tags) ? body.tags.map(String).slice(0, 30) : [];
      if (markdown.length > MAX_MD) return json({ error: 'This note is too long to publish.' }, 413);
    }

    const now = Date.now();
    const existing = await env.DB.prepare('SELECT slug, protected, burn, expires_at FROM pages WHERE vault_id = ? AND note_id = ?').bind(vaultId, noteId).first();
    const expiresAt = days === -1 ? existing?.expires_at || null : days ? now + days * 86400_000 : null;
    // Hidden pages get a random slug so the link never reveals the title; changing the mode issues a new link.
    const hidden = isProtected || burn;
    const sameMode = existing && !!existing.protected === isProtected && !!existing.burn === burn;
    const slug = sameMode ? existing.slug : hidden ? `note-${rand(10)}` : `${slugify(title)}-${rand(4)}`;
    const stmts = [];
    if (existing && !sameMode) stmts.push(env.DB.prepare('DELETE FROM pages WHERE vault_id = ? AND note_id = ?').bind(vaultId, noteId));
    stmts.push(
      env.DB.prepare(
        `INSERT INTO pages (slug, vault_id, note_id, title, markdown, tags, created_at, updated_at, protected, burn, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(vault_id, note_id) DO UPDATE SET title = excluded.title, markdown = excluded.markdown, tags = excluded.tags,
           updated_at = excluded.updated_at, protected = excluded.protected, burn = excluded.burn, expires_at = excluded.expires_at`
      ).bind(slug, vaultId, noteId, title, markdown, JSON.stringify(tags), now, now, isProtected ? 1 : 0, burn ? 1 : 0, expiresAt)
    );
    await env.DB.batch(stmts);
    return json({ slug, url: `${origin}/p/${slug}`, updated_at: now, protected: isProtected, burn, expires_at: expiresAt });
  }

  if (request.method === 'DELETE') {
    const noteId = new URL(request.url).searchParams.get('note_id') || '';
    await env.DB.prepare('DELETE FROM pages WHERE vault_id = ? AND note_id = ?').bind(vaultId, noteId).run();
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
}
