// Собирает офлайн-копию доски в desktop/app: pages/board.html + assets/ + локальные копии CDN-библиотек.
// Запуск: node scripts/copy-site.js (вызывается из npm run start / dist:*).
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.resolve(__dirname, '..', 'app');
const NM = path.resolve(__dirname, '..', 'node_modules');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 1) assets целиком (динамические import() геометрии, шрифты, картинки, MathField и т. п.)
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });

// 2) board.html: флаг MF_DESKTOP до всех скриптов, без Firebase и входа
let html = fs.readFileSync(path.join(ROOT, 'pages', 'board.html'), 'utf8');
// В Android-сборке (desktop/android) скачивание blob:/data:-ссылок передаётся в приложение через MFAndroid.save
const flag = `<script>window.MF_DESKTOP=true;document.documentElement.classList.add('mf-desktop');
if (window.MFAndroid) (function () {
  window.MF_ANDROID = true;
  var A = HTMLAnchorElement.prototype, click = A.click, disp = EventTarget.prototype.dispatchEvent;
  var grab = function (a) { var h = a.href || '', n = a.getAttribute('download'); return n != null && /^(blob|data):/.test(h) ? [h, n] : null; };
  A.dispatchEvent = function (e) { if (e && e.type === 'click' && grab(this)) { this.click(); return true; } return disp.call(this, e); };
  A.click = function () {
    var g = grab(this); if (!g) return click.apply(this, arguments);
    var h = g[0], n = g[1];
    fetch(h).then(function (r) { return r.blob(); }).then(function (b) {
      var fr = new FileReader();
      fr.onload = function () { MFAndroid.save(n || 'mathframe-board', String(fr.result).split(',')[1] || '', b.type || 'application/octet-stream'); };
      fr.readAsDataURL(b);
    });
  };
})();</script>`;
html = html.replace(/<head>/i, (m) => m + '\n' + flag);
if (!html.includes('MF_DESKTOP')) throw new Error('не найден <head> в board.html');
html = html.replace(/<script[^>]+src="https:\/\/www\.gstatic\.com\/firebasejs\/[^"]+"[^>]*><\/script>\s*/g, '');
html = html.replace(/<script[^>]+src="\/assets\/js\/auth\.js"[^>]*><\/script>\s*/g, '');
html = html.replace(/<title>[^<]*<\/title>/i, '<title>MathFrame — Доска</title>');
fs.mkdirSync(path.join(OUT, 'board'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'board', 'index.html'), html);

// 3) Библиотеки, которые сайт берёт с CDN (main.js перенаправляет запросы на эти копии)
const vendor = [
  ['mathjax/es5', 'vendor/mathjax/es5'],
  ['jspdf/dist/jspdf.umd.min.js', 'vendor/jspdf/jspdf.umd.min.js'],
];
for (const [from, to] of vendor) {
  const src = path.join(NM, from);
  if (!fs.existsSync(src)) { console.warn('[copy-site] нет ' + from + ' — будет загружаться из сети'); continue; }
  fs.mkdirSync(path.dirname(path.join(OUT, to)), { recursive: true });
  fs.cpSync(src, path.join(OUT, to), { recursive: true });
}

// 4) В копии board.js — адреса CDN на локальные файлы (сайт не меняется)
const bj = path.join(OUT, 'assets', 'js', 'board.js');
let code = fs.readFileSync(bj, 'utf8');
const swaps = [
  ['https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js', '/vendor/mathjax/es5/tex-svg.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', '/vendor/jspdf/jspdf.umd.min.js'],
];
for (const [cdn, local] of swaps) {
  if (!fs.existsSync(path.join(OUT, local))) continue;
  if (!code.includes(cdn)) console.warn('[copy-site] в board.js не найден ' + cdn);
  code = code.split(cdn).join(local);
}
fs.writeFileSync(bj, code);
console.log('[copy-site] готово: ' + OUT);
