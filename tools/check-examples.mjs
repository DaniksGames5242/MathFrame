// Компилирует все data/examples/*.gms тем же компилятором, что и сайт; выход 1, если хоть один не собрался.
//   node tools/check-examples.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { compile } = await import(pathToFileURL(path.join(root, 'assets/js/gms-compiler.js')).href);
const dir = path.join(root, 'data/examples');
const bad = [];
let ok = 0;
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.gms')) continue;
  try {
    const r = compile(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (r.success) ok++; else bad.push(f + ': ' + (r.errors || []).slice(0, 1).join(' ').slice(0, 160));
  } catch (e) { bad.push(f + ': ' + e.message.slice(0, 160)); }
}
console.log(`Примеров собрано: ${ok}, с ошибками: ${bad.length}`);
if (bad.length) { console.log(bad.join('\n')); process.exit(1); }
