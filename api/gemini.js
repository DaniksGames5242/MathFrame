// api/gemini.js
// Thin relay to generativelanguage.googleapis.com (Gemini API).
//
// The AI-autogeneration panel in hierarchy-editor.html needs this because
// Google's Generative Language API does not send an Access-Control-Allow-Origin
// header on its responses — browsers block the request outright (both with
// the key as a header and as a ?key= query param), so a direct client-side
// fetch can never work from any origin. Since this is same-origin (our own
// page calling our own /api route), no such restriction applies here; this
// function just forwards the request server-to-server and relays the result.
//
// The API key is the user's own (pasted into the editor, kept in their
// browser's localStorage) — it is read from a request header for this one
// call and forwarded straight to Google. It is never logged, stored, or
// written anywhere on this server.

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/';

module.exports = async (req, res) => {
  const key = req.headers['x-gemini-key'];
  if (!key || typeof key !== 'string') {
    res.status(400).json({ error: 'Отсутствует заголовок x-gemini-key.' });
    return;
  }
  const path = String((req.query && req.query.path) || '');
  // Only ever a relative path under v1beta/ — never let the client redirect
  // this relay to an arbitrary host.
  if (!path || path.startsWith('/') || path.includes('://') || path.includes('..')) {
    res.status(400).json({ error: 'Некорректный path.' });
    return;
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Метод не поддерживается' });
    return;
  }

  try {
    const upstream = await fetch(GEMINI_BASE + path, {
      method: req.method,
      headers: Object.assign(
        { 'x-goog-api-key': key },
        req.method === 'POST' ? { 'content-type': 'application/json' } : {}
      ),
      body: req.method === 'POST'
        ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}))
        : undefined,
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('content-type', upstream.headers.get('content-type') || 'application/json');
    const retryAfter = upstream.headers.get('retry-after');
    if (retryAfter) res.setHeader('retry-after', retryAfter);
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: 'Не удалось связаться с Gemini API: ' + e.message });
  }
};
