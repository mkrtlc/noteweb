// Public site: GET /api/u/:handle -> { title, bio, handle, pages: [{ slug, title, tags, updated_at, excerpt }] }
// Lists only open pages: password-protected and view-once pages are never listed.
const strip = md =>
  md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);

export async function onRequestGet({ params, env }) {
  const headers = { 'Content-Type': 'application/json' };
  if (!env.DB) return new Response(JSON.stringify({ error: 'unavailable' }), { status: 503, headers });
  const handle = String(params.handle || '').toLowerCase().slice(0, 40);
  const site = await env.DB.prepare('SELECT vault_id, handle, title, bio FROM sites WHERE handle = ?').bind(handle).first();
  if (!site) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: { ...headers, 'Cache-Control': 'no-store' } });
  const { results } = await env.DB.prepare(
    `SELECT slug, title, tags, updated_at, substr(markdown, 1, 800) AS md FROM pages
     WHERE vault_id = ? AND protected = 0 AND burn = 0 AND (expires_at IS NULL OR expires_at > ?)
     ORDER BY updated_at DESC LIMIT 500`
  )
    .bind(site.vault_id, Date.now())
    .all();
  const pages = results.map(p => ({ slug: p.slug, title: p.title, tags: JSON.parse(p.tags || '[]'), updated_at: p.updated_at, excerpt: strip(p.md) }));
  return new Response(JSON.stringify({ handle: site.handle, title: site.title, bio: site.bio || '', pages }), {
    headers: { ...headers, 'Cache-Control': 'public, max-age=60' },
  });
}
