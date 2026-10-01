// api/_handbook.js
// Поиск по справочнику MathFrame на сервере — инструмент AI-агента (api/chat.js).
//
// Страница агента сама подбирает к вопросу до четырёх тем (assets/js/ai-agent.js ›
// retrieve) и присылает их описания. Этого мало, когда нужная тема называется
// иначе, чем спросили, или нужна тема «по соседству». Поэтому у модели есть свой
// поиск: она запрашивает его строкой [[поиск: …]], сервер находит темы и даёт ей
// их описания. Индекс строится теми же функциями, что и на странице (stems,
// buildIndex, retrieve, htmlToText), — результаты одинаковы там и тут.

const fs = require('fs');
const path = require('path');
const agent = require('../assets/js/ai-agent.js');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'topics', 'config.json');
const TEXT_LIMIT = 1800;

let cache = null;        // { index, byId, children }
let loading = null;

async function readConfig(origin) {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    // Файл не попал в сборку функции — берём с сайта (он лежит в статике).
    if (!origin) throw e;
    const r = await fetch(origin.replace(/\/$/, '') + '/data/topics/config.json');
    if (!r.ok) throw new Error('config.json: HTTP ' + r.status);
    return r.json();
  }
}

async function load(origin) {
  if (cache) return cache;
  if (!loading) {
    loading = readConfig(origin).then((list) => {
      const topics = Array.isArray(list) ? list : [];
      const byId = new Map();
      const children = new Map();
      for (const t of topics) {
        if (!t || !t.id || byId.has(t.id)) continue;
        byId.set(t.id, t);
        if (t.parent) {
          if (!children.has(t.parent)) children.set(t.parent, []);
          children.get(t.parent).push(t);
        }
      }
      cache = { index: agent.buildIndex([...byId.values()]), byId, children };
      return cache;
    }).catch((e) => { loading = null; throw e; });
  }
  return loading;
}

// Тема → материал для модели (тот же вид, что присылает страница).
function topicContext(h, t) {
  let text = agent.htmlToText(t.description || '').slice(0, TEXT_LIMIT);
  const rel = [];
  const parent = t.parent && h.byId.get(t.parent);
  const kids = (h.children.get(t.id) || []).slice(0, 12).map((k) => k.title);
  if (parent) rel.push('Родительская тема: ' + parent.title + '.');
  if (kids.length) rel.push('Дочерние темы: ' + kids.join(', ') + '.');
  if (rel.length) text = (text ? text + '\n\n' : '') + rel.join(' ');
  return { id: t.id, title: t.title || t.id, type: t.type || 'topic', text };
}

// Поиск: по каждому запросу — лучшие темы, без повторов и уже известных (exclude).
async function searchHandbook(queries, opts = {}) {
  const h = await load(opts.origin);
  const exclude = new Set(opts.exclude || []);
  const k = opts.k || 4;
  const out = [];
  for (const q of queries) {
    let hits = agent.retrieve(h.index, q, { k, exclude });
    // Запрос — точное название темы, которое retrieve мог отсеять порогом
    if (!hits.length) hits = agent.searchTitles(h.index, q, 2).map((x) => ({ id: x.id }));
    for (const r of hits) {
      if (exclude.has(r.id)) continue;
      const t = h.byId.get(r.id);
      if (!t) continue;
      exclude.add(r.id);
      out.push(topicContext(h, t));
    }
  }
  return out.slice(0, opts.max || 6);
}

// Запрос поиска в начале ответа модели: [[поиск: запрос; запрос]].
const SEARCH_RE = /^\s*\[\[\s*(?:поиск|search)\s*:\s*([^\]\n]{1,300})\]\]/i;
function parseSearchRequest(text) {
  const m = SEARCH_RE.exec(text);
  if (!m) return null;
  const queries = m[1].split(/[;|]/).map((s) => s.trim()).filter(Boolean).slice(0, 3);
  return queries.length ? queries : null;
}
// Может ли начало ответа ещё оказаться запросом поиска (чтобы не показать его).
function mayBeSearchRequest(text) {
  const s = text.replace(/^\s+/, '');
  if (!s) return true;
  const probe = '[[поиск:', probeEn = '[[search:';
  const low = s.toLowerCase().replace(/\[\[\s*/, '[[').replace(/\s*:/, ':');
  if (probe.startsWith(low) || probeEn.startsWith(low)) return true;               // ещё печатается начало
  if ((low.startsWith(probe) || low.startsWith(probeEn)) && !/\]\]/.test(s) && s.length < 320 && !/\n/.test(s)) return true; // ждём «]]»
  return false;
}

module.exports = { searchHandbook, parseSearchRequest, mayBeSearchRequest, _load: load };
