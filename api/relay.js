// api/relay.js
// Одна функция вместо двух (лимит тарифа Hobby — 12 функций). Ретрансляторы для редактора иерархии, только админы:
//   /api/gemini → ?op=gemini  (_relay_gemini.js)
//   /api/llm    → ?op=llm     (_relay_llm.js)
// Адреса остаются прежними — их переписывает vercel.json.

const HANDLERS = {
  gemini: () => require('./_relay_gemini'),
  llm: () => require('./_relay_llm'),
};

module.exports = async function handler(req, res) {
  const op = String((req.query && req.query.op) || '');
  if (!HANDLERS[op]) { res.status(404).json({ error: 'Не найдено' }); return; }
  return HANDLERS[op]()(req, res);
};
