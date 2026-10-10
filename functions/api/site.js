// Public site settings (NoteWeb Pro): noteweb.co/u/<handle> lists your public pages.
//   GET    /api/site                     { site: { handle, title, bio } | null }
//   POST   /api/site { handle, title, bio }
//   DELETE /api/site                     takes the site down (pages stay published)
import { json, requirePro } from '../../server/pro.js';

const HANDLE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
const RESERVED = new Set(['admin', 'api', 'app', 'blog', 'help', 'noteweb', 'pricing', 'pro', 'support', 'www', 'about', 'login', 'settings']);

export async function onRequest({ request, env }) {
  const auth = await requirePro(request, env);
  if (auth.error) return auth.error;
  const { vaultId } = auth;

  if (request.method === 'GET') {
    const site = await env.DB.prepare('SELECT handle, title, bio FROM sites WHERE vault_id = ?').bind(vaultId).first();
    return json({ site: site || null });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const handle = String(body.handle || '').trim().toLowerCase();
    const title = String(body.title || '').trim().slice(0, 80);
    const bio = String(body.bio || '').trim().slice(0, 280);
    if (!HANDLE.test(handle) || RESERVED.has(handle)) {
      return json({ error: 'Use 3 to 30 lowercase letters, numbers or dashes.' }, 400);
    }
    if (!title) return json({ error: 'Give your site a title.' }, 400);
    const taken = await env.DB.prepare('SELECT vault_id FROM sites WHERE handle = ?').bind(handle).first();
    if (taken && taken.vault_id !== vaultId) return json({ error: 'That address is taken.' }, 409);
    await env.DB.prepare(
      `INSERT INTO sites (vault_id, handle, title, bio, created_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(vault_id) DO UPDATE SET handle = excluded.handle, title = excluded.title, bio = excluded.bio`
    )
      .bind(vaultId, handle, title, bio, Date.now())
      .run();
    return json({ site: { handle, title, bio } });
  }

  if (request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM sites WHERE vault_id = ?').bind(vaultId).run();
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
}
