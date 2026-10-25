// api/_ratelimit.js
// Общий (между экземплярами функций) счётчик запросов в Firestore: коллекция rateLimits, документ на ключ.
// Скользящее окно в час, как в chat.js › checkRateLimit. Считает только сервер (сервисный аккаунт обходит
// правила; клиенту коллекция закрыта). Чтение-правка-запись не атомарны — этого достаточно, чтобы
// нельзя было обойти лимит, попадая на разные экземпляры. Если Firestore недоступен или не настроен,
// возвращает ok (локальный счётчик в chat.js всё равно работает).

const crypto = require('crypto');
const fs = require('./_fs');

const WINDOW_MS = 60 * 60 * 1000;
const MAX_KEEP = 400;

async function sharedCheck(key, limit, cost) {
  if (!fs.enabled()) return { ok: true };
  cost = Math.max(1, cost || 1);
  const id = crypto.createHash('sha1').update(String(key)).digest('hex');
  try {
    const now = Date.now();
    const doc = await fs.getDoc('rateLimits/' + id);
    const list = ((doc && Array.isArray(doc.t)) ? doc.t : []).filter(t => typeof t === 'number' && now - t < WINDOW_MS);
    if (list.length + cost > limit) {
      const idx = Math.min(list.length - 1, Math.max(0, list.length + cost - limit - 1));
      const oldest = list.length ? list[idx] : now;
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000)) };
    }
    for (let i = 0; i < cost; i++) list.push(now);
    await fs.patchDoc('rateLimits/' + id, { t: list.slice(-MAX_KEEP), updatedAt: now });
    return { ok: true };
  } catch (e) {
    return { ok: true };
  }
}

module.exports = { sharedCheck };
