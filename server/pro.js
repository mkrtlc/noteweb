// Shared helpers for Pro APIs (Cloudflare Pages Functions).
// Auth = the Polar license key sent in the X-License-Key header. Keys are only
// stored as SHA-256 hashes; validation results are cached in D1.

const POLAR_ORG_ID = '1268ea4e-3dcf-4efc-9b30-b38878e4c8e7';
const VALIDATE_URL = 'https://api.polar.sh/v1/customer-portal/license-keys/validate';
const GRANTED_TTL = 6 * 3600 * 1000;
const DENIED_TTL = 15 * 60 * 1000;

export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });

const sha256 = async text => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
};

/** Returns { vaultId } for a valid Pro license, or a Response to send back. */
export async function requirePro(request, env) {
  if (!env.DB) return { error: json({ error: 'Sync is not configured.' }, 503) };
  const key = (request.headers.get('X-License-Key') || '').trim();
  if (!key || key.length > 200) return { error: json({ error: 'NoteWeb Pro license required.' }, 401) };

  const keyHash = await sha256(key);
  // Local development only (wrangler pages dev --binding DEV_LICENSE_BYPASS=1); never set in production.
  if (env.DEV_LICENSE_BYPASS === '1' && key.startsWith('DEV-')) return { vaultId: `dev-${keyHash.slice(0, 16)}` };
  const now = Date.now();
  const cached = await env.DB.prepare('SELECT customer_id, status, checked_at FROM licenses WHERE key_hash = ?').bind(keyHash).first();
  if (cached) {
    const fresh = now - cached.checked_at < (cached.status === 'granted' ? GRANTED_TTL : DENIED_TTL);
    if (fresh) {
      if (cached.status === 'granted' && cached.customer_id) return { vaultId: cached.customer_id };
      return { error: json({ error: 'This license is not active.' }, 403) };
    }
  }

  let status = 'invalid';
  let customerId = null;
  try {
    const res = await fetch(VALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, organization_id: POLAR_ORG_ID }),
    });
    if (res.ok) {
      const data = await res.json();
      status = data.status || 'invalid';
      customerId = data.customer_id || data.customer?.id || null;
    } else if (res.status !== 404 && res.status !== 422) {
      // Polar unreachable: fall back to a granted cache entry if we have one.
      if (cached?.status === 'granted' && cached.customer_id) return { vaultId: cached.customer_id };
      return { error: json({ error: 'License server unavailable, try again shortly.' }, 503) };
    }
  } catch {
    if (cached?.status === 'granted' && cached.customer_id) return { vaultId: cached.customer_id };
    return { error: json({ error: 'License server unavailable, try again shortly.' }, 503) };
  }

  await env.DB.prepare(
    'INSERT INTO licenses (key_hash, customer_id, status, checked_at) VALUES (?, ?, ?, ?) ON CONFLICT(key_hash) DO UPDATE SET customer_id = excluded.customer_id, status = excluded.status, checked_at = excluded.checked_at'
  )
    .bind(keyHash, customerId, status, now)
    .run();

  if (status === 'granted' && customerId) return { vaultId: customerId };
  return { error: json({ error: 'This license is not active.' }, 403) };
}
