// api/_topics.js
// Темы справочника для серверных страниц (api/topic.js, api/sitemap.js): config.json читается один раз
// на экземпляр функции (файл попадает в сборку через includeFiles в vercel.json).

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'topics', 'config.json');
const SITE = String(process.env.SITE_URL || 'https://math-frame.vercel.app').replace(/\/$/, '');

let cache = null;

function load() {
  if (cache) return cache;
  const list = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const byId = new Map();
  const children = new Map();
  for (const t of list) byId.set(t.id, t);
  for (const t of list) {
    if (!t.parent) continue;
    if (!children.has(t.parent)) children.set(t.parent, []);
    children.get(t.parent).push(t);
  }
  cache = { list, byId, children };
  return cache;
}

module.exports = { load, SITE };
