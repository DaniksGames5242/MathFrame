// Проверка конфигурации Vercel: не больше 12 серверных функций (лимит тарифа Hobby), у каждой записи functions
// есть файл, у каждого rewrite на /api/… есть функция. Файлы api/_*.js функциями не считаются.
//   node tools/check-vercel.mjs
import fs from 'fs';

const cfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const fns = fs.readdirSync('api').filter(f => f.endsWith('.js') && !f.startsWith('_'));
const errs = [];
if (fns.length > 12) errs.push(`функций в api/: ${fns.length}, лимит Hobby — 12 (${fns.join(', ')})`);
for (const k of Object.keys(cfg.functions || {})) if (!fs.existsSync(k)) errs.push(`vercel.json: functions → нет файла ${k}`);
for (const r of cfg.rewrites || []) {
  const m = /^\/api\/([\w-]+)/.exec(r.destination);
  if (m && !fns.includes(m[1] + '.js')) errs.push(`rewrite ${r.source} → ${r.destination}: нет api/${m[1]}.js`);
}
console.log(`Функций: ${fns.length}/12, проблем: ${errs.length}`);
if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
