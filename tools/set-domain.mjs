// Смена основного домена сайта в статических файлах (canonical, og, robots, десктоп-приложение, api).
//   node tools/set-domain.mjs https://ваш-домен.ru [https://старый-домен]
// Старый домен по умолчанию — https://math-frame.vercel.app. Динамические страницы (api/topic.js, api/sitemap.js)
// берут домен из переменной Vercel SITE_URL — задайте её тоже.
import { execSync } from 'child_process';
import fs from 'fs';

const norm = u => String(u || '').replace(/\/+$/, '');
const to = norm(process.argv[2]);
const from = norm(process.argv[3] || 'https://math-frame.vercel.app');
if (!/^https:\/\/[a-z0-9.-]+$/i.test(to)) {
  console.error('usage: node tools/set-domain.mjs https://domain.tld [https://old-domain]');
  process.exit(2);
}

const files = execSync('git grep -l -F -- ' + JSON.stringify(from), { encoding: 'utf8' }).split('\n').filter(f => f && f !== 'tools/set-domain.mjs');
let n = 0;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const out = s.split(from).join(to);
  if (out !== s) { fs.writeFileSync(f, out); n++; console.log('обновлён', f); }
}
console.log(`Готово: ${n} файл(ов). Не забудьте переменную Vercel SITE_URL=${to} и добавление сайта в Вебмастер/Search Console.`);
