// api/admin-ai.js
// Сводка настроек AI-сервисов сайта для админ-панели (/admin/#ai).
//
//   GET /api/admin-ai   Authorization: Bearer <Firebase ID token>
//   → 200 { provider, model, simplifyModel, keys, webSearch, chatRateLimit,
//           simplifyRateLimit, jarvis, github, superEmails, limits:{user,admin} }
//   → 401 без токена / с неверным токеном, 403 — если это не администратор.
//
// Только чтение и только для администраторов (роль определяет тот же identify(),
// что и в api/chat.js: владелец — подтверждённый e-mail из SUPER_ADMIN_EMAILS,
// админ — admins/{uid}.granted == true). Сами ключи никогда не отдаются —
// только их количество. Новых переменных окружения не требует.

const chat = require('./chat');
const AI = require('./_ai');
const { getConfig, identify, superEmails } = chat._internal;

function bearerToken(req) {
  const auth = String((req.headers && req.headers.authorization) || '');
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
}

module.exports = async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Метод не поддерживается', code: 'method' });
    return;
  }
  const token = bearerToken(req);
  const who = token ? await identify(token).catch(() => null) : null;
  if (!who) {
    res.status(401).json({ error: 'Нужен вход администратора.', code: 'auth' });
    return;
  }
  if (who.role !== 'owner' && who.role !== 'admin') {
    res.status(403).json({ error: 'Только для администраторов.', code: 'forbidden' });
    return;
  }

  const cfg = getConfig();
  // Действующие значения: лимиты из панели (settings/ai), иначе — переменные окружения
  const ai = typeof chat._internal.loadAiSettings === 'function' ? await chat._internal.loadAiSettings().catch(() => null) : null;
  const simplifyRate = (ai && ai.simplifyRateLimit) || Math.max(1, parseInt(process.env.SIMPLIFY_RATE_LIMIT, 10) || 20);
  res.status(200).json({
    role: who.role,
    configured: !!(cfg.provider && cfg.keys.length),
    provider: cfg.providerId,
    providerKnown: !!cfg.provider,
    model: cfg.model,
    simplifyModel: cfg.providerId === 'ngrok' ? AI.TASK_MODELS.simplify() : (process.env.SIMPLIFY_MODEL || cfg.model),
    // ngrok AI Gateway: три модели на выбор в AI-агенте и модели авто-функций
    tiers: cfg.providerId === 'ngrok' ? Object.keys(AI.TIERS).map(id => ({ id, label: AI.TIERS[id].label, model: AI.tierModel(id), cost: AI.TIERS[id].cost })) : null,
    taskModels: cfg.providerId === 'ngrok' ? { geometry: AI.TASK_MODELS.geometry(), vision: AI.TASK_MODELS.vision() } : null,
    fallback: cfg.fallback ? { provider: cfg.fallback.providerId, model: cfg.fallback.model, keys: cfg.fallback.keys.length } : null,
    keys: cfg.keys.length,
    webSearch: cfg.webSearch,
    chatRateLimit: (ai && ai.chatRateLimit) || cfg.rateLimit, // запросов в час на пользователя (админы без лимита)
    aiSettings: ai,                             // как сервер прочитал settings/ai (source: firestore|missing|cache|env)
    simplifyRateLimit: { anonymous: simplifyRate, signedIn: simplifyRate * 2 },
    jarvis: { configured: !!cfg.jarvis.token, customUrl: !!String(process.env.JARVIS_URL || '').trim() },
    github: { configured: !!process.env.GITHUB_TOKEN, repo: (process.env.GITHUB_OWNER || 'DaniksGames5242') + '/' + (process.env.GITHUB_REPO || 'MathFrame'), branch: process.env.GITHUB_BRANCH || 'main' },
    superEmails: superEmails().size,
    superEmailsFromEnv: !!String(process.env.SUPER_ADMIN_EMAILS || '').trim(),
    // true, когда api/chat.js научится читать лимиты из Firestore settings/ai
    // (экспортирует _internal.loadAiSettings) — до этого значения из панели не применяются.
    overridesSupported: typeof chat._internal.loadAiSettings === 'function',
    region: process.env.VERCEL_REGION || null,
    env: process.env.VERCEL_ENV || null,
  });
};
