// api/sitemap.js
// GET /sitemap.xml (rewrite в vercel.json): общие страницы сайта + страница каждой темы справочника.

const { load, SITE } = require('./_topics');

const STATIC = ['/', '/spravochnik/', '/forum/', '/ai-agent/', '/mini-services/', '/playground/', '/board/', '/support/', '/privacy/', '/terms/'];

module.exports = async function handler(req, res) {
  let list;
  try { list = load().list; } catch (e) { list = []; }
  const urls = STATIC.concat(list.map(t => '/spravochnik/' + encodeURIComponent(t.id) + '/'));
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => '  <url><loc>' + SITE + u + '</loc></url>').join('\n') + '\n</urlset>\n';
  res.status(200);
  res.setHeader('content-type', 'application/xml; charset=utf-8');
  res.setHeader('cache-control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.send(xml);
};
