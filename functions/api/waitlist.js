// Cloudflare Pages Function: POST /api/waitlist
// Stores Pro waitlist signups in the WAITLIST KV namespace (free tier).
// Keys: email:<address> -> JSON record; rl:<ip> -> request counter (1h TTL).

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function onRequestPost({ request, env }) {
  if (!env.WAITLIST) return json({ error: 'Waitlist is not available right now.' }, 503);

  const origin = request.headers.get('Origin') || '';
  if (origin && !/^https:\/\/([a-z0-9-]+\.)*(noteweb\.co|noteweb-dk4\.pages\.dev)$/.test(origin) && !origin.startsWith('http://localhost')) {
    return json({ error: 'Forbidden' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Honeypot: bots fill hidden fields. Pretend success.
  if (body.website) return json({ ok: true });

  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: 'Please enter a valid email address.' }, 400);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rlKey = `rl:${ip}`;
  const count = parseInt((await env.WAITLIST.get(rlKey)) || '0', 10);
  if (count >= 10) return json({ error: 'Too many attempts. Please try again later.' }, 429);
  await env.WAITLIST.put(rlKey, String(count + 1), { expirationTtl: 3600 });

  const key = `email:${email}`;
  if (await env.WAITLIST.get(key)) return json({ ok: true, already: true });

  const record = {
    email,
    plan: body.plan === 'monthly' ? 'monthly' : 'yearly',
    source: String(body.source || '').slice(0, 40),
    anonId: String(body.anonId || '').slice(0, 64),
    country: request.cf?.country || null,
    createdAt: new Date().toISOString(),
  };
  await env.WAITLIST.put(key, JSON.stringify(record));
  return json({ ok: true });
}

export const onRequest = () => json({ error: 'Method not allowed' }, 405);
