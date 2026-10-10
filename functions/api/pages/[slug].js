// Public read endpoint for published notes.
//   GET  /api/pages/:slug   the page. View-once pages only return { burn: true } (plus the password check if protected).
//   POST /api/pages/:slug   opens a view-once page: returns it and deletes it in the same step.
const headers = { 'Content-Type': 'application/json' };
const noStore = { ...headers, 'Cache-Control': 'no-store' };
const reply = (body, status = 200, h = noStore) => new Response(JSON.stringify(body), { status, headers: h });
const missing = () => reply({ error: 'not found' }, 404);

const load = async (env, slug) => {
  const page = await env.DB.prepare(
    `SELECT p.slug, p.title, p.markdown, p.tags, p.updated_at, p.protected, p.burn, p.expires_at, s.handle AS site_handle, s.title AS site_title
     FROM pages p LEFT JOIN sites s ON s.vault_id = p.vault_id WHERE p.slug = ?`
  )
    .bind(slug)
    .first();
  if (!page) return null;
  if (page.expires_at && page.expires_at <= Date.now()) {
    await env.DB.prepare('DELETE FROM pages WHERE slug = ?').bind(slug).run();
    return null;
  }
  return page;
};

const shape = page => {
  const base = { updated_at: page.updated_at, expires_at: page.expires_at || null, burn: !!page.burn };
  if (page.protected) return { ...base, protected: true, cipher: JSON.parse(page.markdown) };
  return {
    ...base,
    title: page.title,
    markdown: page.markdown,
    tags: JSON.parse(page.tags || '[]'),
    // View-once pages stay out of the public site, so they don't advertise it either.
    site: page.site_handle && !page.burn ? { handle: page.site_handle, title: page.site_title } : null,
  };
};

export async function onRequestGet({ params, env }) {
  if (!env.DB) return reply({ error: 'unavailable' }, 503);
  const page = await load(env, String(params.slug || '').slice(0, 120));
  if (!page) return missing();
  if (page.burn) {
    const preview = { burn: true, protected: !!page.protected, expires_at: page.expires_at || null };
    if (page.protected) {
      const { salt, check_iv, check_ct } = JSON.parse(page.markdown);
      preview.check = { salt, check_iv, check_ct };
    }
    return reply(preview);
  }
  const cacheable = !page.protected && !page.expires_at;
  return reply(shape(page), 200, cacheable ? { ...headers, 'Cache-Control': 'public, max-age=60' } : noStore);
}

export async function onRequestPost({ params, env }) {
  if (!env.DB) return reply({ error: 'unavailable' }, 503);
  const slug = String(params.slug || '').slice(0, 120);
  const page = await load(env, slug);
  if (!page || !page.burn) return missing();
  // Delete first: only the request that removes the row gets the content.
  const res = await env.DB.prepare('DELETE FROM pages WHERE slug = ? AND burn = 1').bind(slug).run();
  if (!res.meta.changes) return missing();
  return reply(shape(page));
}
