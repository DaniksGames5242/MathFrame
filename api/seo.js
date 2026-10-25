// api/seo.js
// Одна функция вместо трёх (у тарифа Hobby на Vercel лимит — 12 серверных функций). Маршруты — в vercel.json:
//   /spravochnik/:id/ → ?kind=topic&id=…   страница темы для поисковиков (_seo_topic.js)
//   /api/topics       → ?kind=topics       лёгкий список тем / описание одной темы (_seo_topics.js)
//   /sitemap.xml      → ?kind=sitemap      карта сайта (_seo_sitemap.js)
//   /api/translate    → ?kind=translate    перевод интерфейса и тем на английский (_translate.js)

const HANDLERS = {
  topic: () => require('./_seo_topic'),
  topics: () => require('./_seo_topics'),
  sitemap: () => require('./_seo_sitemap'),
  translate: () => require('./_translate'),
};

module.exports = async function handler(req, res) {
  const kind = String((req.query && req.query.kind) || '');
  if (!HANDLERS[kind]) { res.status(404).json({ error: 'Не найдено' }); return; }
  return HANDLERS[kind]()(req, res);
};
