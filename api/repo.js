// api/repo.js
// Одна функция вместо трёх (лимит тарифа Hobby — 12 функций). Файлы репозитория для редакторов, только админы:
//   /api/example  → ?op=example   создать/удалить файл примера (_repo_example.js)
//   /api/examples → ?op=examples  список примеров (_repo_examples.js)
//   /api/file     → ?op=file      прочитать файл из data/ (_repo_file.js)
// Адреса /api/example|examples|file остаются прежними — их переписывает vercel.json.

const HANDLERS = {
  example: () => require('./_repo_example'),
  examples: () => require('./_repo_examples'),
  file: () => require('./_repo_file'),
};

module.exports = async function handler(req, res) {
  const op = String((req.query && req.query.op) || '');
  if (!HANDLERS[op]) { res.status(404).json({ error: 'Не найдено' }); return; }
  return HANDLERS[op]()(req, res);
};
