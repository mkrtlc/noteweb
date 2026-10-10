// Public read endpoint for published notes: GET /api/pages/:slug
export async function onRequestGet({ params, env }) {
  const headers = { 'Content-Type': 'application/json' };
  if (!env.DB) return new Response(JSON.stringify({ error: 'unavailable' }), { status: 503, headers });
  const slug = String(params.slug || '').slice(0, 120);
  const page = await env.DB.prepare('SELECT title, markdown, tags, updated_at FROM pages WHERE slug = ?').bind(slug).first();
  if (!page) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: { ...headers, 'Cache-Control': 'no-store' } });
  return new Response(JSON.stringify({ ...page, tags: JSON.parse(page.tags || '[]') }), {
    headers: { ...headers, 'Cache-Control': 'public, max-age=60' },
  });
}
