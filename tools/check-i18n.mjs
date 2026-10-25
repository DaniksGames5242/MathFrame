// Проверка английского словаря assets/i18n/en.json: валидный JSON, ключи — нормализованный русский текст,
// переводы не пустые, плейсхолдеры {0}/{1} в ключе и переводе совпадают, в переводе нет кириллицы.
//   node tools/check-i18n.mjs
import fs from 'fs';

const d = JSON.parse(fs.readFileSync('assets/i18n/en.json', 'utf8'));
const errs = [];
const ph = s => (String(s).match(/\{\d+\}/g) || []).sort().join(',');
for (const [k, v] of Object.entries(d)) {
  if (k !== k.replace(/\s+/g, ' ').trim()) errs.push(`ключ не нормализован: «${k}»`);
  if (typeof v !== 'string' || !v.trim()) errs.push(`пустой перевод: «${k}»`);
  else {
    if (ph(k) !== ph(v)) errs.push(`плейсхолдеры не совпадают: «${k}» → «${v}»`);
    if (/[А-Яа-яЁё]/.test(v)) errs.push(`кириллица в переводе: «${k}» → «${v}»`);
  }
}
console.log(`Записей: ${Object.keys(d).length}, проблем: ${errs.length}`);
if (errs.length) { console.log(errs.slice(0, 30).join('\n')); process.exit(1); }
