// Список примеров для песочницы (/playground/): id файла data/examples/<id>.gms,
// название темы и её раздел. Перегенерировать после добавления примеров:
//   node tools/gms-examples-index/build.mjs
import fs from 'node:fs';

const topics = JSON.parse(fs.readFileSync('data/topics/config.json', 'utf8'));
const byId = new Map();
for (const t of topics) if (!byId.has(t.id)) byId.set(t.id, t);
const root = (t) => { let p = t, guard = 0; while (p && p.parent && byId.has(p.parent) && guard++ < 50) p = byId.get(p.parent); return p; };

const out = [];
for (const f of fs.readdirSync('data/examples').sort()) {
  if (!f.endsWith('.gms')) continue;
  const id = f.slice(0, -4);
  const t = byId.get(id);
  const r = t ? root(t) : null;
  out.push([id, t ? t.title.replace(/\s*\(см\..*\)$/, '') : id, r && r !== t ? r.title : '']);
}
out.sort((a, b) => (a[2] || 'я').localeCompare(b[2] || 'я', 'ru') || a[1].localeCompare(b[1], 'ru'));
fs.writeFileSync('data/gms-docs/examples-index.json', JSON.stringify(out));
console.log(out.length, 'примеров');
