// api/support.js
// Поддержка сайта и «Сообщить об ошибке» в справочнике — письмо владельцу (api/_mail.js).
//
// POST { type: 'support' | 'error', message, email?, name?, topicId?, topicTitle?, url?, website? }
//   Вход не обязателен; если в Authorization передан токен Firebase, в письмо попадает аккаунт.
//   website — «ловушка» для ботов: настоящий пользователь её не видит и не заполняет.
//   → 200 { ok:true } | 4xx/5xx { error, code }

const chat = require('./chat');
const mail = require('./_mail');

const { identify, bearerToken, checkRateLimit } = chat._internal;
const LIMIT_PER_HOUR = 5;

const str = (v, max) => (typeof v === 'string' ? v : '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, max).trim();

function clientIp(req) {
  const xf = String((req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || '');
  return xf.split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'unknown';
}

async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Только POST', code: 'method' }); }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ error: 'Пустой запрос.', code: 'bad' });

  if (str(b.website, 200)) return res.status(200).json({ ok: true }); // бот: делаем вид, что приняли

  const type = b.type === 'error' ? 'error' : 'support';
  const message = str(b.message, 4000);
  const email = str(b.email, 200);
  if (message.length < 10) return res.status(400).json({ error: 'Опишите вопрос или ошибку подробнее (минимум 10 символов).', code: 'bad' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Проверьте адрес почты.', code: 'bad' });

  let who = null;
  const token = bearerToken(req);
  if (token) who = await identify(token).catch(() => null);

  const rl = checkRateLimit('support:' + (who ? who.uid : clientIp(req)), LIMIT_PER_HOUR, 1);
  if (!rl.ok) return res.status(429).json({ error: 'Вы уже отправили несколько сообщений. Попробуйте через ' + Math.max(1, Math.ceil(rl.retryAfterSec / 60)) + ' мин.', code: 'rate' });

  if (!mail.configured()) return res.status(503).json({ error: 'Отправка сообщений пока не настроена. Напишите на mathframe.ru@gmail.com.', code: 'config' });

  const name = str(b.name, 100);
  const topicTitle = str(b.topicTitle, 300), topicId = str(b.topicId, 200), url = str(b.url, 500);
  const lines = [
    type === 'error' ? 'Сообщение об ошибке в справочнике' : 'Обращение в поддержку',
    '',
    'От: ' + (name || '—') + (email ? ' <' + email + '>' : ' (почта не указана)'),
    who ? 'Аккаунт: ' + (who.email || '—') + ' · UID ' + who.uid : 'Аккаунт: не вошёл',
  ];
  if (type === 'error') lines.push('Тема: ' + (topicTitle || '—') + (topicId ? ' (' + topicId + ')' : ''));
  if (url) lines.push('Страница: ' + url);
  lines.push('', message);

  const e = mail.esc;
  const html = '<h2>' + (type === 'error' ? 'Ошибка в справочнике' : 'Обращение в поддержку') + '</h2>' +
    '<p><b>От:</b> ' + e(name || '—') + (email ? ' &lt;' + e(email) + '&gt;' : ' (почта не указана)') + '<br>' +
    (who ? '<b>Аккаунт:</b> ' + e(who.email || '—') + ' · UID ' + e(who.uid) : '<b>Аккаунт:</b> не вошёл') + '</p>' +
    (type === 'error' ? '<p><b>Тема:</b> ' + e(topicTitle || '—') + (topicId ? ' <code>' + e(topicId) + '</code>' : '') + '</p>' : '') +
    (url ? '<p><b>Страница:</b> ' + e(url) + '</p>' : '') +
    '<blockquote style="border-left:3px solid #ccc;margin:0;padding:0 12px;white-space:pre-wrap">' + e(message) + '</blockquote>';

  const sent = await mail.sendMail({
    subject: (type === 'error' ? 'Ошибка в справочнике: ' + (topicTitle || topicId || 'без темы') : 'Поддержка MathFrame: ' + message.replace(/\s+/g, ' ').slice(0, 60)),
    text: lines.join('\n'), html, replyTo: email || (who && who.email) || undefined,
  });
  if (!sent.sent) return res.status(502).json({ error: 'Не удалось отправить сообщение. Попробуйте позже или напишите на mathframe.ru@gmail.com.', code: 'upstream' });
  return res.status(200).json({ ok: true });
}

module.exports = handler;
