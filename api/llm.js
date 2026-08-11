// api/llm.js
// Same-origin relay for OpenAI-compatible free/cheap LLM providers (Groq,
// OpenRouter) — an alternative to Gemini in the AI-autogeneration panel for
// accounts whose Gemini free tier is unavailable (region/account
// restrictions Google enforces server-side, nothing this app can fix).
// Mirrors api/gemini.js (same reasoning: browsers get no CORS headers back
// from these APIs either, so this has to be a server-to-server relay), kept
// as a separate file since the request/response shape is a different API
// family (OpenAI-compatible chat/completions, not Gemini's generateContent).
//
// The API key is the user's own, kept in their browser's localStorage,
// forwarded here for exactly this one call. Never logged, stored, or
// written anywhere on this server.

const BASES = {
  groq: 'https://api.groq.com/openai/v1/',
  openrouter: 'https://openrouter.ai/api/v1/',
};

module.exports = async (req, res) => {
  const key = req.headers['x-llm-key'];
  if (!key || typeof key !== 'string') {
    res.status(400).json({ error: 'Отсутствует заголовок x-llm-key.' });
    return;
  }
  const provider = String((req.query && req.query.provider) || '');
  const base = BASES[provider];
  if (!base) {
    res.status(400).json({ error: 'Неизвестный provider.' });
    return;
  }
  const path = String((req.query && req.query.path) || '');
  if (!path || path.startsWith('/') || path.includes('://') || path.includes('..')) {
    res.status(400).json({ error: 'Некорректный path.' });
    return;
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Метод не поддерживается' });
    return;
  }

  const headers = { 'Authorization': 'Bearer ' + key };
  if (req.method === 'POST') headers['content-type'] = 'application/json';
  if (provider === 'openrouter') {
    // OpenRouter uses these to attribute/rank apps on its public leaderboard —
    // optional, but recommended by their docs and harmless to include.
    headers['HTTP-Referer'] = 'https://math-frame.vercel.app';
    headers['X-Title'] = 'MathFrame';
  }

  try {
    const upstream = await fetch(base + path, {
      method: req.method,
      headers,
      body: req.method === 'POST'
        ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}))
        : undefined,
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('content-type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: 'Не удалось связаться с ' + provider + ': ' + e.message });
  }
};
