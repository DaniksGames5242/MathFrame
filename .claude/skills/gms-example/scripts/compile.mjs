// Компиляция .gms в HTML тем же компилятором, что и на сайте.
//   node .claude/skills/gms-example/scripts/compile.mjs data/examples/<id>.gms <out>.html
// Код выхода 1 и список ошибок в stderr — если компиляция не удалась.
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const { compile } = await import(pathToFileURL(path.join(root, 'assets/js/gms-compiler.js')).href);

const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('usage: compile.mjs <in.gms> <out.html>'); process.exit(2); }
const r = compile(fs.readFileSync(src, 'utf8'));
if (!r.success) { console.error(r.errors.join('\n')); process.exit(1); }
fs.writeFileSync(out, r.html);
console.log('ok', out, r.html.length);
