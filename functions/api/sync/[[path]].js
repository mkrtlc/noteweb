// End-to-end encrypted sync for NoteWeb Pro.
//   GET    /api/sync/vault          vault metadata (salt + passphrase check), or 404
//   POST   /api/sync/vault          create vault { salt, check_iv, check_ct }
//   DELETE /api/sync/vault          erase vault and all items (forgotten passphrase)
//   POST   /api/sync/push           { items: [{ item_id, kind, iv, ct, deleted, updated_at }] }
//   GET    /api/sync/pull?since=N   items changed after cursor N
// The server never sees plaintext: iv/ct are AES-GCM output from the browser.
import { json, requirePro } from '../../../server/pro.js';

const MAX_ITEMS = 100;
const MAX_CT = 1_500_000;
const PULL_LIMIT = 300;
const B64 = /^[A-Za-z0-9+/=]*$/;

const getVault = (env, vaultId) => env.DB.prepare('SELECT salt, check_iv, check_ct, seq FROM vaults WHERE vault_id = ?').bind(vaultId).first();

export async function onRequest({ request, env, params }) {
  const auth = await requirePro(request, env);
  if (auth.error) return auth.error;
  const { vaultId } = auth;
  const route = (params.path || []).join('/');
  const method = request.method;

  if (route === 'vault' && method === 'GET') {
    const v = await getVault(env, vaultId);
    return v ? json({ exists: true, ...v }) : json({ exists: false }, 404);
  }

  if (route === 'vault' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const { salt, check_iv, check_ct } = body;
    if (![salt, check_iv, check_ct].every(x => typeof x === 'string' && x.length > 0 && x.length < 400 && B64.test(x))) {
      return json({ error: 'Invalid vault data.' }, 400);
    }
    const res = await env.DB.prepare('INSERT OR IGNORE INTO vaults (vault_id, salt, check_iv, check_ct, seq, created_at) VALUES (?, ?, ?, ?, 0, ?)')
      .bind(vaultId, salt, check_iv, check_ct, Date.now())
      .run();
    if (!res.meta.changes) return json({ error: 'A sync vault already exists for this license.' }, 409);
    return json({ ok: true }, 201);
  }

  if (route === 'vault' && method === 'DELETE') {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM items WHERE vault_id = ?').bind(vaultId),
      env.DB.prepare('DELETE FROM vaults WHERE vault_id = ?').bind(vaultId),
    ]);
    return json({ ok: true });
  }

  if (route === 'push' && method === 'POST') {
    if (!(await getVault(env, vaultId))) return json({ error: 'Set up sync first.' }, 404);
    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return json({ accepted: [], seq: (await getVault(env, vaultId)).seq });
    if (items.length > MAX_ITEMS) return json({ error: `At most ${MAX_ITEMS} items per push.` }, 413);
    for (const it of items) {
      const ok =
        typeof it.item_id === 'string' &&
        it.item_id.length <= 80 &&
        (it.kind === 'note' || it.kind === 'folder') &&
        Number.isFinite(it.updated_at) &&
        (it.deleted ? true : typeof it.iv === 'string' && typeof it.ct === 'string' && it.ct.length <= MAX_CT && B64.test(it.iv) && B64.test(it.ct));
      if (!ok) return json({ error: 'Invalid item.' }, 400);
    }
    // Reserve a block of sequence numbers for this push.
    const row = await env.DB.prepare('UPDATE vaults SET seq = seq + ? WHERE vault_id = ? RETURNING seq').bind(items.length, vaultId).first();
    const base = row.seq - items.length + 1;
    const stmts = items.map((it, i) =>
      env.DB.prepare(
        `INSERT INTO items (vault_id, item_id, kind, iv, ct, deleted, updated_at, seq) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(vault_id, item_id) DO UPDATE SET kind = excluded.kind, iv = excluded.iv, ct = excluded.ct,
           deleted = excluded.deleted, updated_at = excluded.updated_at, seq = excluded.seq
         WHERE excluded.updated_at >= items.updated_at`
      ).bind(vaultId, it.item_id, it.kind, it.deleted ? null : it.iv, it.deleted ? null : it.ct, it.deleted ? 1 : 0, Math.floor(it.updated_at), base + i)
    );
    const results = await env.DB.batch(stmts);
    const accepted = items.filter((_, i) => results[i].meta.changes > 0).map(it => it.item_id);
    return json({ accepted, seq: row.seq });
  }

  if (route === 'pull' && method === 'GET') {
    const since = Math.max(0, parseInt(new URL(request.url).searchParams.get('since') || '0', 10) || 0);
    const v = await getVault(env, vaultId);
    if (!v) return json({ error: 'Set up sync first.' }, 404);
    const { results } = await env.DB.prepare(
      'SELECT item_id, kind, iv, ct, deleted, updated_at, seq FROM items WHERE vault_id = ? AND seq > ? ORDER BY seq LIMIT ?'
    )
      .bind(vaultId, since, PULL_LIMIT + 1)
      .all();
    const more = results.length > PULL_LIMIT;
    const page = results.slice(0, PULL_LIMIT);
    return json({ items: page, cursor: page.length ? page[page.length - 1].seq : since, more, head: v.seq });
  }

  return json({ error: 'Not found' }, 404);
}
