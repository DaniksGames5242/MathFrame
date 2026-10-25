// api/_mail.js
// Письма владельцу сайта (уведомления модерации, обращения в поддержку, сообщения
// об ошибках в справочнике). Отправка — через Resend (https://resend.com, HTTP API,
// без зависимостей).
//   RESEND_API_KEY   ключ API Resend (без него письма не уходят: sendMail → { sent:false })
//   MAIL_TO          получатель, по умолчанию mathframe.ru@gmail.com
//   MAIL_FROM        отправитель, по умолчанию «MathFrame <onboarding@resend.dev>»
//                    (тестовый адрес Resend доставляет только на почту владельца аккаунта
//                    Resend; для другого получателя подтвердите свой домен в Resend)

const TO = () => String(process.env.MAIL_TO || 'mathframe.ru@gmail.com').split(/[\s,;]+/).filter(Boolean);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function configured() { return !!process.env.RESEND_API_KEY; }

// opts: { subject, text, html?, replyTo? } → { sent, error? }
async function sendMail(opts) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, error: 'RESEND_API_KEY не задан' };
  try {
    const body = {
      from: process.env.MAIL_FROM || 'MathFrame <onboarding@resend.dev>',
      to: TO(),
      subject: String(opts.subject || '').slice(0, 200),
      text: String(opts.text || '').slice(0, 40000),
    };
    if (opts.html) body.html = String(opts.html).slice(0, 100000);
    if (opts.replyTo) body.reply_to = opts.replyTo;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) {
      const t = (await r.text().catch(() => '')).slice(0, 300);
      console.warn('[mail] Resend ' + r.status + ' ' + t);
      return { sent: false, error: 'Resend ' + r.status };
    }
    return { sent: true };
  } catch (e) {
    console.warn('[mail] ' + (e && e.message));
    return { sent: false, error: (e && e.message) || 'ошибка отправки' };
  }
}

module.exports = { sendMail, configured, esc };
