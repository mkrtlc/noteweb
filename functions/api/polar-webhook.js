// Cloudflare Pages Function: POST /api/polar-webhook
// Receives Polar webhooks (Standard Webhooks format), verifies the signature with
// POLAR_WEBHOOK_SECRET, and keeps a small sales ledger in the SALES KV namespace:
//   event:<webhook-id>          raw event (30 days, also used for de-duplication)
//   order:<order id>            latest order state
//   sub:<subscription id>       latest subscription state
//   customer:<email>            last known status per customer

const enc = new TextEncoder();

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const b64ToBytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const bytesToB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));

// Polar signs with the raw secret's bytes; "whsec_" secrets are base64-encoded keys.
const secretKeyBytes = secret => (secret.startsWith('whsec_') ? b64ToBytes(secret.slice(6)) : enc.encode(secret));

const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

async function verify(request, body, secret) {
  const id = request.headers.get('webhook-id');
  const ts = request.headers.get('webhook-timestamp');
  const sigHeader = request.headers.get('webhook-signature') || '';
  if (!id || !ts || !sigHeader) return null;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return null; // replay window
  const key = await crypto.subtle.importKey('raw', secretKeyBytes(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = bytesToB64(await crypto.subtle.sign('HMAC', key, enc.encode(`${id}.${ts}.${body}`)));
  const ok = sigHeader.split(' ').some(part => {
    const [version, sig] = part.split(',');
    return version === 'v1' && sig && timingSafeEqual(sig, expected);
  });
  return ok ? id : null;
}

export async function onRequestPost({ request, env }) {
  if (!env.POLAR_WEBHOOK_SECRET || !env.SALES) return json({ error: 'not configured' }, 503);
  const body = await request.text();
  const id = await verify(request, body, env.POLAR_WEBHOOK_SECRET);
  if (!id) return json({ error: 'invalid signature' }, 403);

  if (await env.SALES.get(`event:${id}`)) return json({ ok: true, duplicate: true });

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  const type = String(event.type || '');
  const d = event.data || {};
  await env.SALES.put(`event:${id}`, JSON.stringify({ type, receivedAt: new Date().toISOString(), data: d }), { expirationTtl: 30 * 86400 });

  const email = d.customer?.email || d.customer_email || null;
  const product = d.product?.name || null;

  if (type.startsWith('order.')) {
    await env.SALES.put(
      `order:${d.id}`,
      JSON.stringify({ type, id: d.id, status: d.status, email, product, amount: d.total_amount ?? d.amount, currency: d.currency, billing_reason: d.billing_reason, created_at: d.created_at, updated: new Date().toISOString() })
    );
  }
  if (type.startsWith('subscription.')) {
    await env.SALES.put(
      `sub:${d.id}`,
      JSON.stringify({ type, id: d.id, status: d.status, email, product, amount: d.amount, interval: d.recurring_interval, cancel_at_period_end: d.cancel_at_period_end, current_period_end: d.current_period_end, updated: new Date().toISOString() })
    );
  }
  if (email && (type.startsWith('order.') || type.startsWith('subscription.') || type.startsWith('benefit_grant.'))) {
    await env.SALES.put(`customer:${email.toLowerCase()}`, JSON.stringify({ lastEvent: type, status: d.status || null, product, updated: new Date().toISOString() }));
  }
  return json({ ok: true });
}

export const onRequest = () => json({ error: 'Method not allowed' }, 405);
