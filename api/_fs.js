// api/_fs.js
// Firestore REST с правами сервера (сервисный аккаунт Firebase) — для того, что
// пользователь не должен уметь делать сам: публикация статьи форума после проверки
// ИИ и черновики отклонённых статей (коллекция forumDrafts, клиенту не доступна).
//
// Переменная окружения FIREBASE_SERVICE_ACCOUNT — JSON ключа сервисного аккаунта
// (Firebase → Настройки проекта → Сервисные аккаунты → «Создать новый закрытый ключ»),
// как есть или в base64. Без неё enabled() === false, и модерация форума отвечает
// «не настроено» (публикация без проверки не включается).
//   FIREBASE_PROJECT_ID  необязательно (по умолчанию mathframe-ff436)

const crypto = require('crypto');

const PROJECT = process.env.FIREBASE_PROJECT_ID || 'mathframe-ff436';
const BASE = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(PROJECT) + '/databases/(default)/documents';

function account() {
  let raw = String(process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!raw) return null;
  try {
    if (raw[0] !== '{') raw = Buffer.from(raw, 'base64').toString('utf8');
    const a = JSON.parse(raw);
    return a && a.client_email && a.private_key ? a : null;
  } catch (e) { return null; }
}
function enabled() { return !!account(); }

let cached = null; // { token, until }
async function accessToken() {
  if (cached && cached.until > Date.now() + 60000) return cached.token;
  const a = account();
  if (!a) throw new Error('FIREBASE_SERVICE_ACCOUNT не задан');
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const uri = a.token_uri || 'https://oauth2.googleapis.com/token';
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: a.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: uri, iat: now, exp: now + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(a.private_key).toString('base64url');
  const r = await fetch(uri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + unsigned + '.' + sig,
    signal: AbortSignal.timeout(10000),
  });
  const d = await r.json().catch(() => null);
  if (!r.ok || !d || !d.access_token) throw new Error('Не удалось получить токен сервисного аккаунта: ' + ((d && (d.error_description || d.error)) || r.status));
  cached = { token: d.access_token, until: Date.now() + (d.expires_in || 3600) * 1000 };
  return cached.token;
}

/* ---- значения: JS ↔ Firestore ---- */
class Ts { constructor(d) { this.date = d || new Date(); } }
function enc(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Ts) return { timestampValue: v.date.toISOString() };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  return { mapValue: { fields: fields(v) } };
}
function fields(o) { const f = {}; for (const k of Object.keys(o)) if (o[k] !== undefined) f[k] = enc(o[k]); return f; }
function dec(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
  if ('mapValue' in v) return decFields(v.mapValue.fields || {});
  return null;
}
function decFields(f) { const o = {}; for (const k of Object.keys(f || {})) o[k] = dec(f[k]); return o; }
function fromDoc(d) { return d && d.name ? Object.assign({ id: d.name.split('/').pop() }, decFields(d.fields)) : null; }

async function call(method, path, body) {
  const token = await accessToken();
  const r = await fetch(BASE + path, {
    method,
    headers: { Authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const d = await r.json().catch(() => null);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('Firestore ' + r.status + ': ' + ((d && d.error && d.error.message) || path));
  return d;
}

const getDoc = async path => fromDoc(await call('GET', '/' + path));
// создать документ (id — свой или авто) → { id, ...данные }
async function createDoc(collection, id, data) {
  const d = await call('POST', '/' + collection + (id ? '?documentId=' + encodeURIComponent(id) : ''), { fields: fields(data) });
  return fromDoc(d);
}
// обновить только переданные поля (остальные остаются)
async function patchDoc(path, data) {
  const mask = Object.keys(data).filter(k => data[k] !== undefined).map(k => 'updateMask.fieldPaths=' + encodeURIComponent('`' + k + '`')).join('&');
  return fromDoc(await call('PATCH', '/' + path + '?' + mask, { fields: fields(data) }));
}
async function deleteDoc(path) { await call('DELETE', '/' + path); }
// where поле == значение (по одному полю, без индексов); null-значения не нужны
async function queryEq(collection, field, value, limit) {
  const d = await call('POST', ':runQuery', { structuredQuery: {
    from: [{ collectionId: collection }],
    where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: enc(value) } },
    limit: limit || 200,
  } });
  return (d || []).filter(x => x.document).map(x => fromDoc(x.document));
}
async function listAll(collection, limit) {
  const d = await call('GET', '/' + collection + '?pageSize=' + (limit || 300));
  return d && d.documents ? d.documents.map(fromDoc) : [];
}

module.exports = { enabled, Ts, getDoc, createDoc, patchDoc, deleteDoc, queryEq, listAll, enc, decFields };
