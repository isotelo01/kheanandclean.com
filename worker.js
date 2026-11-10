/* Only runs for /p/<id> (shared photo pages from the app's Photo Pages) and /v/<id> (vCards, below). Everything else on the site
   is served straight from the files, as before (wrangler.toml: run_worker_first = ["/p/*"]).
   It puts the page's title and cover photo into the link preview tags, so a texted link shows the photo. */
const DOC = 'https://firestore.googleapis.com/v1/projects/khean-estimator-78f3e/databases/(default)/documents/photoPages/';
const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const v = url.pathname.match(/^\/(?:v|sample)\/([a-z0-9-]{3,60})(\.vcf)?\/?$/);   /* new cards use /sample/, older ones /v/ */
    if (v) return vcard(request, env, url, v[1], !!v[2]);
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

/* vCards (the app's vCards page): /sample/<id> (older ones /v/<id>) is the contact page (v.html) with a link preview,
   /sample/<id>.vcf is the contact file itself, built fresh from the vcards doc every time. */
const VDOC = 'https://firestore.googleapis.com/v1/projects/khean-estimator-78f3e/databases/(default)/documents/vcards/';
const vesc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const fold = (line) => { const out = []; let s = line; out.push(s.slice(0, 75)); s = s.slice(75); while (s) { out.push(' ' + s.slice(0, 74)); s = s.slice(74); } return out.join('\r\n'); };
async function vcard(request, env, url, id, isFile) {
  let f = null;
  try { const r = await fetch(VDOC + id); if (r.ok) f = (await r.json()).fields || {}; } catch (e) { /* not found below */ }
  const g = (k) => (f && f[k] && f[k].stringValue) || '';
  if (isFile) {
    if (!f) return new Response('Not found', { status: 404 });
    const name = [g('first'), g('last')].filter(Boolean).join(' ') || g('company');
    const tel = (n) => { const d = n.replace(/\D/g, ''); return d.length === 10 ? '+1' + d : '+' + d; };
    const L = ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + vesc(g('last')) + ';' + vesc(g('first')) + ';;;', 'FN:' + vesc(name)];
    if (g('company')) L.push('ORG:' + vesc(g('company')));
    if (g('title')) L.push('TITLE:' + vesc(g('title')));
    if (!g('first') && !g('last') && g('company')) L.push('X-ABShowAs:COMPANY');
    if (g('mobile')) L.push('TEL;TYPE=CELL,VOICE:' + tel(g('mobile')));
    if (g('work')) L.push('TEL;TYPE=WORK,VOICE:' + tel(g('work')));
    if (g('email')) L.push('EMAIL;TYPE=INTERNET:' + g('email'));
    if (g('website')) L.push('URL:' + g('website'));
    if (g('street') || g('city') || g('zip')) L.push('ADR;TYPE=WORK:;;' + [g('street'), g('city'), g('state'), g('zip')].map(vesc).join(';') + ';USA');
    if (g('note')) L.push('NOTE:' + vesc(g('note')));
    const ph = (g('photo') || g('logoSq')).match(/^data:image\/jpeg;base64,(.+)$/);   /* their photo, or the logo */
    if (ph) L.push('PHOTO;ENCODING=b;TYPE=JPEG:' + ph[1]);
    L.push('END:VCARD');
    const file = (name || 'contact').replace(/[^A-Za-z0-9 ._-]/g, '').trim().replace(/\s+/g, '-') || 'contact';
    return new Response(L.map(fold).join('\r\n') + '\r\n', { headers: {
      'content-type': 'text/vcard; charset=utf-8',
      'content-disposition': 'inline; filename="' + file + '.vcf"',
      'cache-control': 'no-store' } });
  }
  const page = await env.ASSETS.fetch(new URL('/v', url));
  let html = await page.text(), tags = '';
  if (f) {
    const name = [g('first'), g('last')].filter(Boolean).join(' ') || g('company') || 'Contact';
    const desc = [g('title'), g('company')].filter(Boolean).join(' · ');
    tags = '<meta property="og:type" content="profile"><meta property="og:title" content="' + esc(name) + '">' +
      (desc ? '<meta property="og:description" content="' + esc(desc) + '">' : '') +
      '<meta property="og:url" content="' + esc(url.origin + url.pathname) + '">';
    html = html.replace('<title>Contact</title>', '<title>' + esc(name) + '</title>');
  }
  return new Response(html.replace('<!--OG-->', tags), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}
