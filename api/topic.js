// api/topic.js
// Страница темы справочника для поисковиков и ссылок: GET /spravochnik/<id>/ (rewrite в vercel.json).
// Интерактивный справочник (/spravochnik/#<id>) рисуется в браузере и по хэшу не индексируется,
// поэтому здесь тот же текст темы отдаётся готовым HTML (формулы — KaTeX на клиенте), со ссылкой
// «Открыть в справочнике» на интерактивную версию с примером.

const { load, SITE } = require('./_topics');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CLASS_NAMES = { 7: '7 класс', 8: '8 класс', 9: '9 класс', 10: '10 класс', 11: '11 класс' };

function plain(html) {
  return String(html || '')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ').replace(/\$[^$\n]*\$/g, ' ')
    .replace(/<[a-z\/][^>]*>/gi, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim();
}
function snippet(html, n) {
  const t = plain(html);
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const i = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' '));
  return cut.slice(0, i > n * 0.6 ? i : n).replace(/[,;:\s]+$/, '') + '…';
}
const url = id => '/spravochnik/' + encodeURIComponent(id) + '/';

// Ссылки «topic:<id>» внутри текста → страницы тем; чужие ссылки открываем безопасно.
function fixLinks(html) {
  return String(html || '')
    .replace(/href="topic:([^"]+)"/g, (m, id) => 'href="' + url(id) + '"')
    .replace(/<a\s+([^>]*href="https?:[^>]*)>/gi, (m, attrs) => '<a ' + attrs.replace(/\s(target|rel)="[^"]*"/g, '') + ' target="_blank" rel="noopener nofollow">');
}

function notFound(res) {
  res.status(404).setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('cache-control', 'public, s-maxage=300');
  res.send('<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="3;url=/spravochnik/">' +
    '<title>Тема не найдена — MathFrame</title></head><body style="font-family:sans-serif;text-align:center;padding:3rem"><h1>Тема не найдена</h1><p><a href="/spravochnik/">Открыть справочник</a></p></body></html>');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); return res.status(405).end(); }
  const id = String((req.query && req.query.id) || '');
  if (!/^[A-Za-z0-9._-]{1,200}$/.test(id)) return notFound(res);
  let data;
  try { data = load(); } catch (e) { return res.status(500).send('Не удалось загрузить справочник'); }
  const t = data.byId.get(id);
  if (!t) return notFound(res);

  const crumbs = [];
  for (let p = t.parent && data.byId.get(t.parent), n = 0; p && n < 12; p = p.parent && data.byId.get(p.parent), n++) crumbs.unshift(p);
  const kids = (data.children.get(t.id) || []).slice(0, 80);
  const sibs = t.parent ? (data.children.get(t.parent) || []).filter(x => x.id !== t.id).slice(0, 24) : [];

  const title = t.title + ' — справочник MathFrame';
  const desc = snippet(t.description, 170) || ('Тема «' + t.title + '» в справочнике по математике MathFrame.');
  const canonical = SITE + url(t.id);
  const kind = t.type === 'theorem' ? 'Теорема' : t.type === 'folder' ? 'Раздел' : 'Тема';
  const cls = CLASS_NAMES[t.class] ? ' · ' + CLASS_NAMES[t.class] : '';
  const kw = Array.isArray(t.keywords) ? t.keywords.join(', ') : String(t.keywords || '');

  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Справочник', item: SITE + '/spravochnik/' }].concat(crumbs.map(c => ({ name: c.title, item: SITE + url(c.id) })), [{ name: t.title, item: canonical }])
      .map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })),
  };
  const link = x => '<li><a href="' + url(x.id) + '">' + esc(x.title) + '</a></li>';

  const html = '<!DOCTYPE html>\n<html lang="ru">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />\n' +
    '<script>(function(){var d=document.documentElement;try{var t=localStorage.getItem(\'theme\');if(t===\'light\'||(t!==\'dark\'&&!matchMedia(\'(prefers-color-scheme: dark)\').matches))d.classList.add(\'light\');}catch(e){}})();</script>\n' +
    '<title>' + esc(title) + '</title>\n<meta name="description" content="' + esc(desc) + '" />\n' + (kw ? '<meta name="keywords" content="' + esc(kw.slice(0, 300)) + '" />\n' : '') +
    '<link rel="canonical" href="' + esc(canonical) + '" />\n<link rel="icon" href="/favicon.ico" sizes="any" />\n<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png" />\n<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png" />\n' +
    '<meta property="og:type" content="article" />\n<meta property="og:site_name" content="MathFrame" />\n<meta property="og:locale" content="ru_RU" />\n' +
    '<meta property="og:title" content="' + esc(title) + '" />\n<meta property="og:description" content="' + esc(desc) + '" />\n<meta property="og:url" content="' + esc(canonical) + '" />\n<meta property="og:image" content="' + SITE + '/assets/img/og-image.png" />\n<meta name="twitter:card" content="summary_large_image" />\n' +
    '<link rel="stylesheet" href="/assets/css/common.css" />\n<link rel="stylesheet" href="/assets/lib/katex/katex.min.css" />\n' +
    '<style>main{max-width:820px;margin:0 auto;padding:1.4rem 1rem 4rem}.tp-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-lg);padding:1.4rem 1.6rem}' +
    '.tp-crumbs{font-size:.85rem;color:var(--text-tertiary);margin:0 0 .8rem}.tp-crumbs a{color:var(--text-secondary)}.tp-kind{font-size:.8rem;color:var(--text-tertiary);margin:0}' +
    '.tp-card h1{margin:.15rem 0 1rem;font-size:1.9rem}.tp-body{line-height:1.7;color:var(--text-secondary)}.tp-body h2{color:var(--text-primary);margin:1.4rem 0 .4rem;font-size:1.2rem}.tp-body a{color:var(--accent);text-decoration:underline;text-underline-offset:2px}' +
    '.tp-cta{display:inline-block;margin:0 0 1.2rem;padding:.7rem 1.2rem;border-radius:var(--r-md,10px);background:var(--accent);color:#fff!important;text-decoration:none;font-weight:600}' +
    '.tp-more h2{font-size:1.05rem;margin:1.6rem 0 .5rem}.tp-more ul{columns:2;column-gap:2rem;padding-left:1.1rem;margin:0}.tp-more a{color:var(--accent)}@media(max-width:560px){.tp-more ul{columns:1}}</style>\n' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>\n' +
    '<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>\n<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>\n<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"></script>\n' +
    '<script defer src="/assets/lib/katex/katex.min.js"></script>\n<script defer src="/assets/lib/katex/contrib/auto-render.min.js"></script>\n</head>\n<body data-page="spravochnik">\n<div id="app-header"></div>\n<main>\n<article class="tp-card">\n' +
    '<nav class="tp-crumbs"><a href="/spravochnik/">Справочник</a>' + crumbs.map(c => ' › <a href="' + url(c.id) + '">' + esc(c.title) + '</a>').join('') + '</nav>\n' +
    '<p class="tp-kind">' + kind + cls + '</p>\n<h1>' + esc(t.title) + '</h1>\n' +
    '<a class="tp-cta" href="/spravochnik/#' + encodeURIComponent(t.id) + '">' + (t.example ? 'Открыть интерактивный пример' : 'Открыть в справочнике') + '</a>\n' +
    '<div class="tp-body" id="tpBody">' + fixLinks(t.description) + '</div>\n' +
    (kids.length ? '<section class="tp-more"><h2>' + (t.type === 'folder' ? 'В этом разделе' : 'Подтемы') + '</h2><ul>' + kids.map(link).join('') + '</ul></section>\n' : '') +
    (sibs.length ? '<section class="tp-more"><h2>Рядом</h2><ul>' + sibs.map(link).join('') + '</ul></section>\n' : '') +
    '</article>\n</main>\n<div id="app-footer"></div>\n<script>var PAGE_ROOT = \'/\';</script>\n<script src="/assets/js/auth.js"></script>\n<script src="/assets/js/common.js"></script>\n' +
    '<script>window.addEventListener("load",function(){if(window.renderMathInElement)renderMathInElement(document.getElementById("tpBody"),{delimiters:[{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false}],throwOnError:false});});</script>\n</body>\n</html>\n';

  res.status(200);
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('cache-control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.send(req.method === 'HEAD' ? '' : html);
};
