// Проверка данных справочника: config.json — массив тем, id уникальны, ссылки topic:/parent/example не битые.
//   node tools/check-data.mjs
import fs from 'fs';

const list = JSON.parse(fs.readFileSync('data/topics/config.json', 'utf8'));
const errs = [];
if (!Array.isArray(list)) { console.error('config.json должен быть массивом'); process.exit(1); }
const ids = new Set();
for (const t of list) {
  if (!t.id || !t.title) errs.push('тема без id/title: ' + JSON.stringify(t).slice(0, 80));
  if (ids.has(t.id)) errs.push('дубль id: ' + t.id);
  ids.add(t.id);
}
const files = new Set(fs.readdirSync('data/examples'));
for (const t of list) {
  if (t.parent && !ids.has(t.parent)) errs.push(`${t.id}: parent «${t.parent}» не найден`);
  if (t.example && !files.has(String(t.example).replace(/^.*\//, ''))) errs.push(`${t.id}: файл примера «${t.example}» не найден`);
  for (const m of String(t.description || '').matchAll(/href="topic:([^"]+)"/g)) if (!ids.has(m[1])) errs.push(`${t.id}: ссылка topic:${m[1]} ведёт в никуда`);
}
console.log(`Тем: ${list.length}, проблем: ${errs.length}`);
if (errs.length) { console.log(errs.slice(0, 40).join('\n')); process.exit(1); }
