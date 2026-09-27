// Client for the local DeepSeek Free-API proxy (D:\DeepSeek API, port 8003).
// Streams the answer (the proxy's non-stream path used to drop text at
// fragment boundaries) and spreads requests over several DeepSeek accounts.
//
// Every account has its own adaptive limiter: concurrency starts low, creeps
// up while the account keeps answering, and is halved — with a pause for that
// account only — as soon as DeepSeek says it is busy or that requests come
// too often. A request goes to whichever account has a free slot right now,
// so N accounts give roughly N times the throughput.
//
// Accounts: the token in D:\DeepSeek API\providers.json (deepseek.api_key)
// plus every entry of D:\DeepSeek API\deepseek-accounts.json:
//   { "accounts": [ { "name": "второй", "token": "<userToken>" }, … ] }
// That file is re-read on the fly — accounts can be added mid-run.
import fs from 'node:fs';

const PROVIDERS_FILE = 'D:/DeepSeek API/providers.json';
const ACCOUNTS_FILE = 'D:/DeepSeek API/deepseek-accounts.json';
const DS_BASE = process.env.DS_BASE || 'http://127.0.0.1:8003/v1';
// Other free-API proxies from D:DeepSeek API, used as extra "accounts" in the
// same pool — each on its fastest model (measured: ~5 s on a short answer).
const EXTRA_PROVIDERS = {
  glm:  { base: 'http://127.0.0.1:8001/v1', model: process.env.GLM_MODEL || 'glm-4.6', name: 'GLM' },
  kimi: { base: 'http://127.0.0.1:8002/v1', model: process.env.KIMI_MODEL || 'kimi-k2', name: 'Kimi' },
};

// DeepSeek throttles each account on message frequency («Слишком частые
// сообщения. Повторите попытку позже.»), so for now every account gets one
// request at a time (DS_MAX_CONC raises it again, up to 10), rests a random
// 6–15 s after each answer, and starts across all accounts are spread by a
// random 2–5 s so the accounts never fire in lockstep.
// GLM and Kimi don't throttle like that (measured: GLM holds 3–4 parallel
// requests, Kimi 6+), so they get their own, looser profile.
const MIN_CONC = 1;
const RAISE_AFTER = 4;          // successes in a row before trying one more slot
const PROFILES = {
  deepseek: { start: 1, max: Math.min(10, +process.env.DS_MAX_CONC || 1), rest: [6000, 15000], gap: [2000, 5000] },
  glm:      { start: 2, max: +process.env.GLM_MAX || 6,   rest: [500, 2000], gap: [300, 1000] },
  kimi:     { start: 2, max: +process.env.KIMI_MAX || 16, rest: [500, 2000], gap: [300, 1000] },
};
const rand = ([lo, hi]) => lo + Math.random() * (hi - lo);
// Starts are spaced per provider: accounts of the same service share an IP
// and its frequency limit, different services don't.
const kindNextAt = {};

let log = () => {};
export function setLogger(fn){ log = fn; }
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- accounts ---------------- */
const accounts = [];            // { name, token, limit, active, okStreak, busyStreak, pauseUntil, lastStart }
let accountsMtime = 0, providersMtime = 0;
function readJson(file){ try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
function addAccount(name, token, kind = 'deepseek'){
  if (!token) return;
  const same = accounts.find(a => a.name === name);
  if (same){
    // Same account, new token (re-login): swap it in and re-enable.
    if (same.token !== token){ same.token = token; same.disabled = false; same.pauseUntil = 0; log('↻ «' + name + '»: новый токен — аккаунт снова в работе'); }
    return;
  }
  if (accounts.some(a => a.token === token)) return;
  const extra = EXTRA_PROVIDERS[kind];
  const prof = PROFILES[kind];
  accounts.push({ name, token, kind, prof, base: extra ? extra.base : DS_BASE, model: extra ? extra.model : null, limit: prof.start, active: 0, okStreak: 0, busyStreak: 0, pauseUntil: 0, nextAt: 0, ok: 0, disabled: false });
  if (accounts.length > 1) log('+ аккаунт DeepSeek «' + name + '» — всего аккаунтов: ' + accounts.length);
}
function loadAccounts(){
  let pst; try { pst = fs.statSync(PROVIDERS_FILE); } catch {}
  if (pst && pst.mtimeMs !== providersMtime){
    providersMtime = pst.mtimeMs;
    const p = readJson(PROVIDERS_FILE);
    addAccount('основной', p && p.deepseek && p.deepseek.api_key);
    if (process.env.DS_ONLY !== '1') for (const [kind, x] of Object.entries(EXTRA_PROVIDERS)) addAccount(x.name, p && p[kind] && p[kind].api_key, kind);
  }
  let st; try { st = fs.statSync(ACCOUNTS_FILE); } catch { return; }
  if (st.mtimeMs === accountsMtime) return;
  accountsMtime = st.mtimeMs;
  const j = readJson(ACCOUNTS_FILE);
  ((j && j.accounts) || []).forEach((a, i) => addAccount(a.name || ('аккаунт ' + (i + 2)), a.token));
}
loadAccounts();
setInterval(loadAccounts, 30000);
export const accountsState = () => accounts.map(a => ({ name: a.name, kind: a.kind, disabled: a.disabled, limit: a.limit, active: a.active, ok: a.ok, paused: Math.max(0, Math.round((a.pauseUntil - Date.now()) / 1000)) }));

/* ---------------- busy / rate-limit detection ---------------- */
class BusyError extends Error {}
class QuotaError extends Error {}
// DeepSeek's own wording (EN/CN) for overload and throttling, plus the
// proxy's placeholder text it emits when the upstream answer isn't a stream.
const BUSY_RE = /слишком част|повторите попытку позже|server is busy|busy|too many requests|rate.?limit|too frequent|请求过于频繁|频繁|繁忙|稍后再试|服务暂时不可用|第三方响应错误/i;

async function once(a, system, user, model, timeoutMs){
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    // DeepSeek model names carry the think/search flags; GLM and Kimi
    // always run on their own fastest model.
    if (a.model) model = a.model;
    const r = await fetch(a.base + '/chat/completions', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: 'Bearer ' + a.token },
      body: JSON.stringify({ model, stream: true, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
    });
    const raw = await r.text();
    if (r.status === 429 || r.status === 503) throw new BusyError('HTTP ' + r.status + ': ' + raw.slice(0, 200));
    if (raw.trim().startsWith('{') || !r.ok){
      let msg = raw.slice(0, 300);
      try { const j = JSON.parse(raw); msg = (j.code || '') + ': ' + (j.message || msg); } catch {}
      if (/配额不足|quota/i.test(msg)) throw new QuotaError(msg);
      throw BUSY_RE.test(msg) ? new BusyError(msg) : new Error('HTTP ' + r.status + ' ' + msg);
    }
    let out = '';
    for (const line of raw.split('\n')){
      if (!line.startsWith('data:')) continue;
      const d = line.slice(5).trim();
      if (!d || d === '[DONE]') continue;
      try {
        const j = JSON.parse(d);
        const delta = (j.choices && j.choices[0] && j.choices[0].delta) || {};
        if (delta.content) out += delta.content;
      } catch {}
    }
    out = out.trim();
    // An instantly closed, textless stream is how an overloaded account
    // answers — treat it as "busy", not as a model failure.
    if (!out) throw new BusyError('пустой ответ');
    // "The server is busy" can also arrive as the answer text itself.
    if (out.length < 300 && BUSY_RE.test(out)) throw new BusyError('ответ-заглушка: ' + out.slice(0, 120));
    return out;
  } catch (e){
    if (e.name === 'AbortError') throw new Error('тайм-аут ' + Math.round(timeoutMs / 1000) + ' с');
    throw e;
  } finally { clearTimeout(timer); }
}

// The proxy reports an expired/revoked token as «深度思考配额不足» (its quota
// lookup fails first), so a quota error is double-checked here.
async function tokenValid(token){
  try {
    const r = await fetch('https://chat.deepseek.com/api/v0/users/current', { headers: { Authorization: 'Bearer ' + token, 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36', 'x-client-platform': 'web' } });
    const j = await r.json();
    return !(j && (j.code === 40003 || /invalid token/i.test(j.msg || '')));
  } catch { return true; }   // network hiccup — don't disable on a guess
}

/* ---------------- per-account adaptive limiter ---------------- */
const waiters = [];
const free = (a, now) => !a.disabled && a.active < a.limit && now >= a.pauseUntil && now >= a.nextAt && now >= (kindNextAt[a.kind] || 0);
function pump(){
  const now = Date.now();
  while (waiters.length){
    const ready = accounts.filter(a => free(a, now));
    if (!ready.length) break;
    // Least loaded first, relative to what each account currently tolerates.
    ready.sort((x, y) => x.active / x.limit - y.active / y.limit);
    const a = ready[0];
    a.active++;
    kindNextAt[a.kind] = now + rand(a.prof.gap);
    waiters.shift()(a);
  }
}
setInterval(pump, 200);
const acquire = () => new Promise(r => { waiters.push(r); pump(); });
function release(a){ a.active--; a.nextAt = Math.max(a.nextAt, Date.now() + rand(a.prof.rest)); pump(); }

function onSuccess(a){
  a.busyStreak = 0; a.ok++;
  if (++a.okStreak >= RAISE_AFTER && a.limit < a.prof.max){
    a.okStreak = 0; a.limit++;
    log('↑ «' + a.name + '»: параллельность ' + a.limit);
  }
}
function onBusy(a, reason){
  a.okStreak = 0; a.busyStreak++;
  const old = a.limit;
  a.limit = Math.max(MIN_CONC, Math.floor(a.limit / 2));
  // 20 s, 40 s, 80 s … up to 10 min, with jitter so retries don't line up.
  const pause = Math.min(20000 * 2 ** (a.busyStreak - 1), 600000) * (0.8 + Math.random() * 0.4);
  a.pauseUntil = Math.max(a.pauseUntil, Date.now() + pause);
  log('⚠ «' + a.name + '» занят (' + reason + ') — параллельность ' + old + ' → ' + a.limit + ', пауза ' + Math.round(pause / 1000) + ' с');
}

export async function dsComplete(system, user, { model = 'deepseek-v4-pro', timeoutMs = 360000, attempts = 5, busyAttempts = 12, log: tlog = () => {}, meta } = {}){
  let fails = 0, busy = 0;
  for (;;){
    const a = await acquire();
    try {
      const out = await once(a, system, user, model, timeoutMs);
      onSuccess(a);
      if (meta) meta.account = a.name + ' / ' + (a.model || model);
      return out;
    } catch (e){
      if (e instanceof QuotaError && a.kind !== 'deepseek'){
        onBusy(a, e.message);
      } else if (e instanceof QuotaError || (a.kind === 'deepseek' && /40003|invalid token|Authorization Failed|401/i.test(e.message))){
        if (!(await tokenValid(a.token))){
          a.disabled = true;
          log('✗ «' + a.name + '»: токен недействителен (invalid token) — аккаунт отключён до нового токена' + (accounts.some(x => !x.disabled) ? '' : '; рабочих аккаунтов нет, прогон ждёт'));
        } else {
          // Out of DeepThink quota on this account: park it, keep thinking on the others.
          a.pauseUntil = Date.now() + 3600000;
          log('⚠ «' + a.name + '»: квота DeepThink исчерпана — аккаунт на паузе 1 ч');
        }
      } else if (e instanceof BusyError){
        onBusy(a, e.message);
        if (++busy > busyAttempts * accounts.length) throw new Error('DeepSeek долго занят: ' + e.message);
      } else {
        if (++fails >= attempts) throw e;
        tlog('⚠ «' + a.name + '» ' + model + ': ' + e.message + ' — повтор ' + fails + '/' + attempts);
        await sleep(Math.min(5000 * fails * fails, 120000));
      }
    } finally { release(a); }
  }
}
