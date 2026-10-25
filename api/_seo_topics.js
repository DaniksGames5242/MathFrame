// api/topics.js
// Лёгкий доступ к справочнику для первой загрузки страницы /spravochnik/:
//   GET /api/topics          → массив тем БЕЗ описаний (структура, названия, классы, ключевые слова, примеры) — десятки раз легче config.json
//   GET /api/topics?id=<id>  → { id, description } одной темы
// Полный config.json (с описаниями) страница догружает только когда нужен поиск по тексту или выгрузка.
// Источник тот же файл data/topics/config.json (попадает в сборку через includeFiles), свежесть — как у статического файла.

const { load } = require('./_topics');

let indexJson = null;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); return res.status(405).end(); }
  let data;
  try { data = load(); } catch (e) { return res.status(500).json({ error: 'Не удалось загрузить справочник' }); }
  res.setHeader('cache-control', 'public, s-maxage=300, stale-while-revalidate=3600');
  const id = String((req.query && req.query.id) || '');
  if (id) {
    const t = data.byId.get(id);
    if (!t) return res.status(404).json({ error: 'Тема не найдена' });
    return res.status(200).json({ id: t.id, description: t.description || '' });
  }
  if (!indexJson) indexJson = JSON.stringify(data.list.map(t => { const o = Object.assign({}, t); delete o.description; return o; }));
  res.status(200);
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.send(req.method === 'HEAD' ? '' : indexJson);
};
