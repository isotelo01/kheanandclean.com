/* Only runs for /p/<id> (shared photo pages from the app's Photo Pages). Everything else on the site
   is served straight from the files, as before (wrangler.toml: run_worker_first = ["/p/*"]).
   It puts the page's title and cover photo into the link preview tags, so a texted link shows the photo. */
const DOC = 'https://firestore.googleapis.com/v1/projects/khean-estimator-78f3e/databases/(default)/documents/photoPages/';
const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/p\/([a-z0-9]{6,20})\/?$/);
    if (!m) return env.ASSETS.fetch(request);
    const page = await env.ASSETS.fetch(new URL('/p', url));
    let html = await page.text(), tags = '';
    try {
      const r = await fetch(DOC + m[1]);
      if (r.ok) {
        const f = (await r.json()).fields || {};
        const title = (f.title && f.title.stringValue) || 'Photos';
        const desc = ((f.message && f.message.stringValue) || '').slice(0, 180);
        const cover = (f.cover && f.cover.stringValue) || '';
        tags = '<meta property="og:type" content="website">' +
          '<meta property="og:title" content="' + esc(title) + '">' +
          (desc ? '<meta property="og:description" content="' + esc(desc) + '">' : '') +
          '<meta property="og:url" content="' + esc(url.origin + url.pathname) + '">' +
          (cover ? '<meta property="og:image" content="' + esc(cover) + '"><meta name="twitter:card" content="summary_large_image">' : '') +
          '<meta name="twitter:title" content="' + esc(title) + '">';
        html = html.replace('<title>Photos</title>', '<title>' + esc(title) + '</title>');
      }
    } catch (e) { /* no preview tags; the page still loads its photos itself */ }
    return new Response(html.replace('<!--OG-->', tags), {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' },
    });
  },
};
