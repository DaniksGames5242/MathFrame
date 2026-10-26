// Проверка документации песочницы (data/gms-docs/tutorial.md и reference.md):
//  - каждый блок ```gms (кнопка «Открыть в редакторе») компилируется без ошибок;
//  - ссылки на разделы [текст](#якорь) ведут на существующий заголовок
//    (якоря строятся так же, как slug() в assets/js/playground.js).
//   node tools/check-gms-docs.mjs
import fs from 'fs';
import { compile } from '../assets/js/gms-compiler.js';

const DOCS = ['data/gms-docs/tutorial.md', 'data/gms-docs/reference.md'];
const errs = [];
const anchors = new Set();
const texts = {};
for (const f of DOCS) {
  const md = fs.readFileSync(f, 'utf8');
  texts[f] = md;
  const used = new Set();
  let inFence = false;
  for (const l of md.split('\n')) {
    if (/^```/.test(l)) { inFence = !inFence; continue; }
    const h = !inFence && l.match(/^(#{1,3})\s+(.*)$/);
    if (!h) continue;
    let s = h[2].toLowerCase().replace(/`/g, '').replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '') || 'r';
    let k = s, n = 2; while (used.has(k)) k = s + '-' + n++;
    used.add(k); anchors.add(k);
  }
}
let blocks = 0;
for (const f of DOCS) {
  const md = texts[f];
  const re = /```gms\n([\s\S]*?)```/g; let m;
  while ((m = re.exec(md))) {
    blocks++;
    const line = md.slice(0, m.index).split('\n').length;
    let r;
    try { r = compile(m[1], { target: 'playground' }); } catch (e) { r = { success: false, errors: [e.message] }; }
    if (!r.success) errs.push(`${f}:${line}: пример не компилируется: ${r.errors.join('; ')}`);
  }
  const lr = /\]\(#([^)\s]+)\)/g;
  while ((m = lr.exec(md))) if (!anchors.has(m[1])) errs.push(`${f}: ссылка на несуществующий раздел #${m[1]}`);
}
console.log(`Примеров: ${blocks}, проблем: ${errs.length}`);
if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
