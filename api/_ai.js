// api/_ai.js
// Shared model/provider settings for every endpoint that spends the SITE's AI
// quota (api/chat.js, api/simplify.js, api/ai-task.js).
//
// Primary provider — ngrok AI Gateway (https://gateway.ngrok.ai/v1, OpenAI-
// compatible, "provider:model" names). Mistral (or whatever AI_AGENT_PROVIDER
// names) stays configured as the fallback: if the gateway key is missing, or a
// request to it fails (key revoked, credits spent, outage), the same request
// is repeated against the old provider, so the site keeps working.
//
// Environment variables:
//   NGROK_AI_KEY          the AI Gateway key (several — comma separated, rotated)
//   NGROK_MODEL_SMALL     optional, overrides the model of the tier «Маленькая»
//   NGROK_MODEL_MEDIUM    optional, «Средняя»
//   NGROK_MODEL_LARGE     optional, «Большая»
//   NGROK_MODEL_VISION    optional, the model used to read photos
//   AI_AGENT_API_KEYS / AI_AGENT_PROVIDER / AI_AGENT_MODEL — the fallback
//                         provider, exactly as before (see api/chat.js)

const NGROK_BASE = 'https://gateway.ngrok.ai/v1/';

// Three models the visitor can pick on the AI-agent page. `cost` is how many
// units of the hourly limit one request takes. It follows the price ratio of
// the models (per million tokens, input/output: gpt-4o-mini 0.15/0.60,
// gpt-4.1-mini 0.40/1.60, gpt-4.1 2.00/8.00 — ≈ 1 : 2.7 : 13), rounded so that
// the default 36 units per hour give 36 small, 12 medium or 3 large answers.
const TIERS = {
  small:  { label: 'Маленькая', env: 'NGROK_MODEL_SMALL',  model: 'openai:gpt-4o-mini',   cost: 1,  hint: 'быстрая, для коротких вопросов' },
  medium: { label: 'Средняя',   env: 'NGROK_MODEL_MEDIUM', model: 'openai:gpt-4.1-mini',  cost: 3,  hint: 'хороший баланс качества и лимита' },
  large:  { label: 'Большая',   env: 'NGROK_MODEL_LARGE',  model: 'openai:gpt-4.1',       cost: 12, hint: 'самая сильная, для сложных задач' },
};
const DEFAULT_TIER = 'medium';

// Models for automatic functions (the visitor doesn't choose them):
//   geometry  — turning a geometry problem the local parser didn't understand
//               into structured data: needs reliable reasoning → medium tier;
//   vision    — reading a problem from a photo: gpt-4o-mini reads printed and
//               handwritten maths well and is the cheapest vision model;
//   simplify  — retelling a handbook topic: the medium tier.
const TASK_MODELS = {
  geometry: () => tierModel('medium'),
  vision:   () => process.env.NGROK_MODEL_VISION || 'openai:gpt-4o-mini',
  // solve — полное решение задачи вне возможностей локального решателя (окружности,
  //           ГМТ, преобразования): нужна сильная модель → «Большая».
  solve:    () => tierModel('large'),
  simplify: () => process.env.SIMPLIFY_MODEL || tierModel('medium'),
};

// Те же три уровня на других провайдерах — бесплатные модели. Используются,
// когда ключа ngrok нет (или он не работает): Mistral на бесплатном тарифе
// «Experiment» даёт все три модели, включая распознавание картинок.
const FREE_TIERS = {
  mistral: { small: 'mistral-small-latest', medium: 'mistral-medium-latest', large: 'mistral-large-latest', vision: 'mistral-small-latest' },
  groq: { small: 'llama-3.1-8b-instant', medium: 'llama-3.3-70b-versatile', large: 'llama-3.3-70b-versatile', vision: 'meta-llama/llama-4-scout-17b-16e-instruct' },
  openrouter: { small: 'meta-llama/llama-3.2-3b-instruct:free', medium: 'meta-llama/llama-3.3-70b-instruct:free', large: 'deepseek/deepseek-r1:free', vision: 'meta-llama/llama-3.2-11b-vision-instruct:free' },
};
function freeModel(provider, tier) {
  const t = FREE_TIERS[provider];
  return t ? t[tier] || t.medium : null;
}
// Модель задачи на бесплатном провайдере.
function freeTaskModel(provider, task) {
  const tier = task === 'ocr' || task === 'vision' ? 'vision' : task === 'solve' ? 'large' : 'medium';
  return freeModel(provider, tier);
}

function splitKeys(s) {
  return String(s || '').split(/[\s,;]+/).map(k => k.trim()).filter(Boolean);
}
function tierModel(tier) {
  const t = TIERS[tier] || TIERS[DEFAULT_TIER];
  return process.env[t.env] || t.model;
}
function normTier(tier) {
  return Object.prototype.hasOwnProperty.call(TIERS, tier) ? tier : DEFAULT_TIER;
}
function ngrokKeys() { return splitKeys(process.env.NGROK_AI_KEY || process.env.NGROK_AI_KEYS); }

// The ngrok provider config in the same shape api/chat.js uses for the others.
function ngrokConfig(model) {
  const keys = ngrokKeys();
  if (!keys.length) return null;
  return {
    providerId: 'ngrok',
    provider: { kind: 'openai', base: NGROK_BASE },
    keys,
    model,
    webSearch: false,
  };
}

// Public description of the tiers for the page (no model names needed there,
// but they're harmless and help the admin see what's in use).
function publicTiers() {
  return Object.keys(TIERS).map(id => ({ id, label: TIERS[id].label, cost: TIERS[id].cost, hint: TIERS[id].hint }));
}

module.exports = { FREE_TIERS, freeModel, freeTaskModel, NGROK_BASE, TIERS, DEFAULT_TIER, TASK_MODELS, tierModel, normTier, ngrokKeys, ngrokConfig, publicTiers, splitKeys };
