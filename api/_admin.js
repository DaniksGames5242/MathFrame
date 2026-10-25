// api/_admin.js
// Общая проверка «запрос пришёл от владельца или администратора» для функций,
// которые пишут в репозиторий или читают его служебные файлы (config, example, file, examples).
// Токен Firebase приходит в Authorization: Bearer …; роль определяет chat.js › identify
// (та же проверка, что у review-notes и ретрансляторов gemini/llm).
// Возвращает информацию о пользователе или null — тогда ответ (401/403) уже отправлен.

const { identify, bearerToken } = require('./chat')._internal;

async function requireAdmin(req, res) {
  res.setHeader('cache-control', 'no-store');
  const token = bearerToken(req);
  const who = token ? await identify(token).catch(() => null) : null;
  if (!who) { res.status(401).json({ ok: false, error: 'Войдите в аккаунт администратора.' }); return null; }
  if (who.role !== 'owner' && who.role !== 'admin') { res.status(403).json({ ok: false, error: 'Только для администраторов.' }); return null; }
  return who;
}

module.exports = { requireAdmin };
