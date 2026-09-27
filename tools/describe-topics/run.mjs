// Offline batch run of the topic-description autogeneration, through the
// local DeepSeek proxy instead of the editor's in-browser providers.
//
// The prompts are NOT copied here: they are read straight out of
// pages/admin/hierarchy-editor.html at start-up, so the site's editor and
// this script always run the same text. The per-topic sequence mirrors the
// editor's aiGenerateOne:
//   rewrite / empty : generation → check → format (HTML+KaTeX) → KaTeX
//                     validation → link candidates → links → sanitize
//   edit            : revise (targeted fixes on the existing HTML) →
//                     formula normalization → KaTeX validation → link
//                     candidates → links → sanitize
//   keep            : links only, and only if the article has none
// plus a triage pass that sorts the existing (ministral-written) articles
// into keep / edit / rewrite and proposes the rare philosophical detail.
//
// Usage (from this folder):
//   node run.mjs empty    [--conc 3] [--limit N]    — topics with no description
//   node run.mjs triage   [--conc 4] [--limit N]    — sort existing articles
//   node run.mjs pick-philosophy [--max 110]        — choose where a detail goes
//   node run.mjs process  [--conc 3] [--only edit|rewrite|keep] [--limit N]
//   node run.mjs one <topicId> <empty|rewrite|edit> — dry run, prints result
//   node run.mjs stats
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { dsComplete, setLogger } from './ds-client.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const EDITOR = path.join(ROOT, 'pages/admin/hierarchy-editor.html');
const CONFIG = path.join(ROOT, 'data/topics/config.json');
const STATE_DIR = path.join(HERE, 'state');
const RESULTS_DIR = path.join(STATE_DIR, 'results');
const STATE_FILE = path.join(STATE_DIR, 'state.json');
const LOG_FILE = path.join(STATE_DIR, 'log.txt');
fs.mkdirSync(RESULTS_DIR, { recursive: true });

// Every step runs with DeepThink and smart (web) search on — «-silent» only
// hides the reasoning text and the [n] citation marks from the output.
const M_GEN = 'deepseek-v4-pro-think-search-silent';
const M_THINK = M_GEN;
const M_PLAIN = M_GEN;

/* ---------------- args / logging ---------------- */
const [cmd, ...rest] = process.argv.slice(2);
const opt = (name, def) => { const i = rest.indexOf('--' + name); return i >= 0 ? rest[i + 1] : def; };
setLogger(log);
function log(...a){
  const line = new Date().toISOString().slice(11, 19) + ' ' + a.join(' ');
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

/* ---------------- prompts, straight from the editor ---------------- */
const P = (() => {
  const html = fs.readFileSync(EDITOR, 'utf8');
  const start = html.indexOf('  const AI_SECTIONS = {');
  const end = html.indexOf('  /* ---------------- link postprocess');
  if (start < 0 || end < 0) throw new Error('не нашёл блок промптов в hierarchy-editor.html');
  return new Function(html.slice(start, end) + `
    return { AI_SECTIONS, aiSection, aiPromptGenerate, aiPromptGenerateFolder, aiPromptCheck, aiPromptFormat,
      AI_PROMPT_FIND_CANDIDATES, AI_PROMPT_LINKS, AI_PROMPT_NORMALIZE_FORMULAS };`)();
})();

/* ---------------- config / tree ---------------- */
let topics = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
const byId = new Map(topics.map(t => [t.id, t]));
const childrenOf = new Map();
topics.forEach(t => { if (t.parent){ if (!childrenOf.has(t.parent)) childrenOf.set(t.parent, []); childrenOf.get(t.parent).push(t); } });
const kids = t => childrenOf.get(t.id) || [];
function ancestors(t){ const out = []; let p = t.parent && byId.get(t.parent); while (p){ out.unshift(p); p = p.parent && byId.get(p.parent); } return out; }
function sectionOf(t){
  const anc = ancestors(t); const rootTitle = (anc[0] || t).title.trim().toLowerCase();
  return Object.keys(P.AI_SECTIONS).find(k => P.AI_SECTIONS[k].label.toLowerCase() === rootTitle) || 'geometry';
}
const TYPE_LABELS = { folder: 'Раздел', topic: 'Тема', theorem: 'Теорема', proof: 'Доказательство' };

const hasText = h => !!String(h || '').replace(/<[^>]*>/g, '').trim();
function decode(s){ return s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'); }
function htmlToPlain(html){
  let text = decode(String(html || '').replace(/<[^>]*>/g, ' '));
  return text.replace(/\$\$[\s\S]*?\$\$/g, ' ').replace(/\$[^$\n]*?\$/g, ' ').replace(/[ \t]+/g, ' ').trim();
}
function stripCodeFences(text){ return String(text || '').trim().replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '').trim(); }
function stripLinks(html){ return String(html).replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1'); }

// Windows refuses the rename (EPERM/EBUSY) while another process — the
// editor, an antivirus or search indexer — briefly holds the target open.
// Retry for a while, then fall back to writing the target in place.
function writeFileAtomic(file, text){
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, text);
  for (let i = 0; i < 20; i++){
    try { fs.renameSync(tmp, file); return; }
    catch (e){
      if (!/EPERM|EBUSY|EACCES/.test(e.code || e.message)) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
  }
  fs.writeFileSync(file, text);
  try { fs.unlinkSync(tmp); } catch {}
}

// Every save rewrites the whole file from memory, so one failed save is made
// good by the next; the chain must never stay rejected, or all later saves
// would silently be skipped.
let saveChain = Promise.resolve();
function saveConfig(){
  const run = saveChain.then(() => writeFileAtomic(CONFIG, JSON.stringify(topics, null, 2)));
  saveChain = run.catch(e => log('⚠ не удалось записать config.json: ' + e.message + ' — повторю при следующем сохранении'));
  return saveChain;
}

/* ---------------- state ---------------- */
const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { triage: {}, done: {}, failed: {}, philosophy: {} };
function saveState(){
  try { writeFileAtomic(STATE_FILE, JSON.stringify(state, null, 1)); }
  catch (e){ log('⚠ не удалось записать state.json: ' + e.message); }
}

// On start-up: a topic marked done whose result never reached config.json
// (a write failed or the process was killed mid-save) gets it written now.
{
  let restored = 0;
  for (const [id, d] of Object.entries(state.done)){
    if (d.action === 'keep') continue;
    delete state.failed[id];
    const file = path.join(RESULTS_DIR, id + '.json');
    const t = byId.get(id);
    if (!t || !fs.existsSync(file)) continue;
    const r = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (r.after && t.description !== r.after){ t.description = r.after; restored++; }
  }
  if (restored){ writeFileAtomic(CONFIG, JSON.stringify(topics, null, 2)); log('↻ восстановлено в config.json готовых тем: ' + restored); }
}
if (!fs.existsSync(path.join(STATE_DIR, 'config.before.json'))) fs.copyFileSync(CONFIG, path.join(STATE_DIR, 'config.before.json'));

/* ---------------- link helpers (ported from the editor) ---------------- */
const RU_STEM_ENDINGS = ['иями','иях','ями','ами','его','ому','ему','ыми','ими',
  'ое','ее','ая','яя','ые','ие','ов','ев','ей','ий','ый','ой','юю','ою','ею',
  'ии','ия','ию','ям','ам','ах','ях','ы','и','а','я','у','ю','о','е','ь','й'].sort((a, b) => b.length - a.length);
function ruStem(word){
  word = String(word || '').toLowerCase().replace(/[^а-яё-]/g, '');
  if (word.length <= 3) return word;
  for (const end of RU_STEM_ENDINGS) if (word.length - end.length >= 3 && word.slice(-end.length) === end) return word.slice(0, -end.length);
  return word;
}
const tokenizeRu = text => String(text || '').toLowerCase().match(/[а-яё]+(?:-[а-яё]+)*/g) || [];
const topicIndex = topics.map(t => ({ id: t.id, title: t.title, type: t.type }));
const validIds = new Set(topicIndex.map(t => t.id));
const stemIdx = (() => {
  const exactMap = new Map(), perTopicStems = new Map();
  topicIndex.forEach(t => {
    const stems = tokenizeRu(t.title).map(ruStem);
    if (!stems.length) return;
    const key = stems.join(' ');
    if (!exactMap.has(key)) exactMap.set(key, []);
    exactMap.get(key).push(t);
    perTopicStems.set(t.id, stems);
  });
  return { exactMap, perTopicStems };
})();
function findExactCandidates(text, selfId){
  const words = tokenizeRu(text).map(ruStem); const found = new Map();
  for (let n = 1; n <= 3; n++) for (let i = 0; i + n <= words.length; i++){
    const hits = stemIdx.exactMap.get(words.slice(i, i + n).join(' '));
    if (hits) hits.forEach(t => { if (t.id !== selfId) found.set(t.id, t); });
  }
  return [...found.values()];
}
function findLoosePool(text, excludeIds, cap){
  const textStems = new Set(tokenizeRu(text).map(ruStem).filter(s => s.length >= 4));
  const scored = [];
  topicIndex.forEach(t => {
    if (excludeIds.has(t.id)) return;
    let score = 0;
    (stemIdx.perTopicStems.get(t.id) || []).forEach(s => { if (s.length >= 4 && textStems.has(s)) score++; });
    if (score > 0) scored.push([score, t]);
  });
  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, cap || 150).map(x => x[1]);
}
const candidateLines = list => list.map(t => 'id: ' + t.id + ' | title: ' + t.title + ' | type: ' + t.type).join('\n');
function sanitizeLinks(html, selfId){
  // Section headings are never links, whatever the model decided.
  html = String(html).replace(/<(h[1-4])>([\s\S]*?)<\/\1>/gi, (m, tag, inner) => "<" + tag + ">" + inner.replace(/<\/?a\b[^>]*>/gi, "") + "</" + tag + ">");
  return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (m, attrs, inner) => {
    const hm = attrs.match(/href\s*=\s*"([^"]*)"/i); const href = hm ? hm[1] : '';
    if (href.startsWith('topic:')){
      const id = href.slice(6);
      return validIds.has(id) && id !== selfId ? '<a href="topic:' + id + '">' + inner + '</a>' : inner;
    }
    if (/^https:\/\/[^\s"<>]+$/.test(href)) return '<a href="' + href + '">' + inner.replace(/<[^>]*>/g, '') + '</a>';
    return inner;
  });
}
const normText = h => decode(String(h).replace(/<[^>]*>/g, '')).replace(/\s+/g, '');

/* ---------------- KaTeX validation ---------------- */
function katexErrors(html){
  const errs = [];
  const text = String(html).replace(/<[^>]*>/g, ' ');
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g; let m;
  while ((m = re.exec(text))){
    const tex = decode(m[1] != null ? m[1] : m[2]);
    try { katex.renderToString(tex, { throwOnError: true, displayMode: m[1] != null, strict: 'ignore' }); }
    catch (e){ errs.push({ tex, error: e.message.slice(0, 200) }); }
  }
  return errs;
}
const AI_PROMPT_FIX_KATEX = `Ты — технический редактор математического справочника. Тебе дан HTML-фрагмент статьи с формулами KaTeX ($…$ — строчные, $$…$$ — блочные) и список формул, которые KaTeX не может отрисовать, с текстом ошибки. Исправь ТОЛЬКО эти формулы так, чтобы они стали корректным KaTeX и по-прежнему означали то же самое. Ничего другого в тексте не меняй — ни слов, ни разметки, ни остальных формул. Выведи только исправленный HTML-фрагмент целиком, без пояснений и без обрамляющих символов.`;

/* ---------------- new batch-only prompts ---------------- */
const rulesFor = (t, sec) => t.type === 'folder' ? P.aiPromptGenerateFolder(sec) : P.aiPromptGenerate(sec);

const aiPromptTriage = (t, sec) => `Ты — главный редактор полного математического справочника, раздел «${sec.label}». Тебе дана одна статья справочника (HTML-фрагмент с формулами KaTeX и внутренними ссылками вида <a href="topic:ID">…</a>, где ID — транслитерация названия темы-адресата) и контекст: название, тип, путь в иерархии, описание родительской темы. Статьи писала слабая нейросеть, и часть из них нужно исправить или переписать. Оцени эту статью и реши, что с ней делать.

Ниже целиком приведены правила, по которым автор пишет статьи этого справочника, — оценивай статью по ним (правило о словесных плейсхолдерах в квадратных скобках вместо формул относится к черновику, а не к готовой статье: в готовой статье формулы уже записаны в KaTeX, и это правильно).

=== ПРАВИЛА АВТОРА ===
${rulesFor(t, sec)}
=== КОНЕЦ ПРАВИЛ ===

## Как выносить решение

- "keep" — статья фактически верна, написана именно про эту тему на нужном уровне общности и в целом соблюдает правила. Мелкие стилистические шероховатости — не повод её трогать.
- "edit" — основа годная, но есть конкретные исправимые недостатки: отдельные фактические ошибки или неточности; предложения-заполнители; запрещённые заголовки («Заключение», «Применение», «Значение» и т.п.); начало с названия темы; неверный регистр (наукообразие или разжёвывание) в отдельных местах; ошибки в формулах, неверный выбор блочных и строчных формул; мусор разметки (обёртка \`\`\`html, markdown); ссылки, ведущие не туда (текст ссылки означает не то понятие, на которое указывает её ID), или одна и та же тема, залинкованная много раз подряд; формулы и свойства, данные без объяснения, откуда они берутся.
- "rewrite" — статья не о той теме или не на том уровне общности; в ней много фактических ошибок; она почти целиком из воды или повторяет описание родителя; для содержательной темы или теоремы вместо статьи написан обзор вида «раздел посвящён…»; нет обязательных частей (определения, точной формулировки теоремы); статья явно слишком бедна для такой темы; или исправлять пришлось бы больше половины текста.
Для раздела (тип «Раздел») требования мягче: это короткий обзор, и «rewrite» нужен только если он не о том, пустой по смыслу или состоит из воды.

## Философская деталь

Отдельно оцени, есть ли у САМОЙ темы настоящий, общеизвестный и достоверный философский или культурный сюжет, который одним предложением в заключительном абзаце сделал бы её глубже (по уровню — как примеры в правилах автора): fit = 3 — такой сюжет есть и он точно про эту тему; 2 — есть, но связь с темой слабее; 1 — натянуто; 0 — нет. Для подавляющего большинства тем ответ 0. Если fit ≥ 2, в idea кратко опиши, какую именно деталь добавить (реальный факт, без выдумок). Если такая деталь в статье уже есть и она уместна — укажи fit 0 и не предлагай вторую.

## Формат вывода

Верни ТОЛЬКО JSON без markdown и пояснений:
{"verdict":"keep|edit|rewrite","issues":["конкретный недостаток 1","…"],"philosophy":{"fit":0,"idea":""}}
В issues перечисли конкретные недостатки (для "keep" — пустой массив), каждый так, чтобы редактор мог его исправить: что не так и где. Не больше 8 пунктов, самые важные первыми.`;

const aiPromptRevise = (t, sec) => `Ты — редактор полного математического справочника, раздел «${sec.label}». Тебе дан HTML-фрагмент статьи (формулы KaTeX в $…$ и $$…$$; внутренние ссылки из него уже убраны, их расставит следующий этап), контекст темы и список конкретных недостатков, найденных главным редактором. Исправь статью.

## Как работать

- Исправь каждый недостаток из списка. Кроме них, исправь всё, что явно нарушает правила автора (приведены ниже).
- Всё, что уже верно и соответствует правилам, сохрани как есть — формулировки, порядок, формулы. Это правка, а не переписывание: не меняй хорошие предложения ради вкуса.
- Фактическую ошибку заменяй верным фактом (проверь его, у тебя есть доступ к интернету); если верный факт установить не можешь — убери утверждение, не выдумывай.
- Если формула или свойство даны без объяснения, откуда они берутся, добавь короткое обоснование по правилу логики изложения.
- Формулы в готовой статье всегда записаны в KaTeX. Если в списке недостатков требуют заменить их словесными описаниями в квадратных скобках или убрать формулы как «слишком сложные» — это ошибка главного редактора, такие пункты игнорируй.
- Философская деталь или отсылка: следуй указанию в запросе (добавить предложенную, оставить уже имеющуюся уместную или не добавлять ничего).

## Правила автора

Ниже — правила, по которым пишутся статьи справочника. Правила о записи формул словами в квадратных скобках и о запрете разметки относятся к черновику и здесь НЕ применяются: формулы остаются в KaTeX, текст остаётся HTML. Всё остальное (содержание, структура, регистр, логика изложения, объём, философская деталь) — применяй.

=== ПРАВИЛА АВТОРА ===
${rulesFor(t, sec)}
=== КОНЕЦ ПРАВИЛ ===

## Оформление результата

Результат оформляй по правилам технического редактора ниже; из них применяй правила разметки (<h2>, <p>, <ul>/<li>, <strong>), пустых строк между блоками, выбора блочных и строчных формул и синтаксиса KaTeX. Правило «не меняй ни одного слова» к этой задаче не относится.

=== ПРАВИЛА ОФОРМЛЕНИЯ ===
${P.aiPromptFormat(sec)}
=== КОНЕЦ ПРАВИЛ ОФОРМЛЕНИЯ ===

## Формат вывода

Выведи только исправленный HTML-фрагмент целиком — без пояснений, без списка правок, без обрамляющих символов и \`\`\`.`;

function philosophyNote(t, action){
  // Brand-new articles: the prompt's own «rare exception» rule decides.
  if (action === 'empty') return '';
  const ph = state.philosophy[t.id];
  if (ph) return '\nФилософская деталь или отсылка: главный редактор предлагает для заключительного абзаца такую — «' + ph + '». Добавь её одним коротким предложением, своими словами, только если она достоверна и точно про эту тему; иначе не добавляй ничего.';
  return '\nФилософская деталь или отсылка: для этой статьи не нужна — не добавляй новую; уже имеющуюся оставь, только если она точная, уместная и единственная.';
}

function contextMsg(t){
  const anc = ancestors(t);
  const parent = anc[anc.length - 1];
  const siblings = (parent ? kids(parent) : topics.filter(x => !x.parent)).filter(x => x.id !== t.id).map(x => x.title);
  const children = kids(t).map(x => x.title);
  let msg = 'Тема: ' + t.title;
  if (t.type === 'theorem') msg += '\nИзвестно, что это теорема — используй структуру пункта 2 напрямую.';
  if (anc.length) msg += '\nПуть в иерархии справочника от корня до родителя этой темы: ' + anc.map(a => a.title).join(' › ');
  if (parent && hasText(parent.description)) msg += '\nОписание родительской темы «' + parent.title + '» — не повторяй уже сказанные в нём факты, пиши только то, что специфично именно для текущей темы:\n' + htmlToPlain(parent.description);
  if (siblings.length) msg += '\nСоседние темы того же уровня иерархии (только для ориентира по границам темы — не пересказывай их содержание): ' + siblings.join(', ');
  if (children.length) msg += '\nДочерние темы, раскрываемые отдельными статьями (не дублируй их содержание здесь, упоминай не более чем обзорно, если вообще нужно): ' + children.join(', ');
  return msg;
}

// A «Формулы» section with no actual formula in it means the draft described
// every formula in words and skipped the [placeholder] — reject it so the
// topic is regenerated instead of stored formula-less.
const FORMULAS_SECTION_RE = /<h2>\s*Формулы[^<]*<\/h2>([\s\S]*?)(?=<h2>|$)/i;
function emptyFormulasSection(html){
  const m = String(html).match(FORMULAS_SECTION_RE);
  return !!(m && !/\$/.test(m[1]));
}
const AI_PROMPT_FIX_FORMULAS_SECTION = `Ты — редактор математического справочника. В HTML-фрагменте статьи есть раздел с заголовком «Формулы», но в нём нет ни одной формулы KaTeX (формулы записываются между $ и $ или $$ и $$) — соотношения описаны только словами. Исправь это одним из двух способов:
- если у темы по существу есть формулы (вычисления, уравнения, соотношения, обозначения), впиши их в этот раздел в синтаксисе KaTeX рядом с уже имеющимся словесным пояснением, не удаляя его;
- если формул у темы по существу нет, убери заголовок <h2>Формулы</h2>, а текст раздела оставь как обычные абзацы.
Больше ничего в тексте не меняй. Выведи только исправленный HTML-фрагмент целиком, без пояснений и без обрамляющих символов.`;

// A «Формулы» section with no actual formula means the formulas were only
// described in words. One targeted repair pass; if the model still leaves it
// empty, the heading goes (its text stays) rather than failing the topic.
async function ensureFormulas(html, steps, tlog){
  if (!emptyFormulasSection(html)) return html;
  tlog('раздел «Формулы» без формул — исправление');
  html = stripCodeFences(await step(steps, 'исправление раздела «Формулы»', AI_PROMPT_FIX_FORMULAS_SECTION, html, M_PLAIN, tlog));
  html = await fixKatex(html, steps, tlog);
  if (emptyFormulasSection(html)){
    tlog('⚠ формулы так и не появились — заголовок «Формулы» убран');
    html = html.replace(/<h2>\s*Формулы[^<]*<\/h2>\s*/i, '');
  }
  return html;
}

// Weaker triage models sometimes demand bracket placeholders instead of
// KaTeX — that rule only applies to drafts, so such "issues" are dropped.
const bogusIssue = s => /плейсхолдер|квадратн\S* скобк/i.test(s);

/* ---------------- pipeline steps ---------------- */
async function step(steps, label, system, user, model, tlog){
  const t0 = Date.now();
  const meta = {};
  const out = await dsComplete(system, user, { model, meta, log: m => tlog(label + ': ' + m) });
  steps.push({ label, account: meta.account, seconds: Math.round((Date.now() - t0) / 1000), text: out });
  return out;
}

async function fixKatex(html, steps, tlog){
  for (let round = 0; round < 2; round++){
    const errs = katexErrors(html);
    if (!errs.length) return html;
    tlog('KaTeX: ошибок ' + errs.length + ' — исправление');
    const list = errs.map(e => 'Формула: ' + e.tex + '\nОшибка: ' + e.error).join('\n\n');
    html = stripCodeFences(await step(steps, 'исправление KaTeX', AI_PROMPT_FIX_KATEX, 'Неисправные формулы:\n' + list + '\n\nHTML-фрагмент:\n' + html, M_PLAIN, tlog));
  }
  const left = katexErrors(html);
  if (left.length) tlog('⚠ KaTeX: остались ошибки: ' + left.map(e => e.tex).join(' | '));
  return html;
}

async function addLinks(t, html, steps, tlog){
  const plain = htmlToPlain(html);
  const exact = findExactCandidates(plain, t.id);
  const exclude = new Set(exact.map(x => x.id)); exclude.add(t.id);
  const pool = findLoosePool(plain, exclude, 150);
  let loose = [];
  if (pool.length){
    try {
      const resp = await step(steps, 'кандидаты (ИИ)', P.AI_PROMPT_FIND_CANDIDATES, 'Текст описания:\n' + plain + '\n\nСписок тем-кандидатов:\n' + candidateLines(pool), M_PLAIN, tlog);
      const ids = new Set(JSON.parse(stripCodeFences(resp).replace(/^json\s*/i, '')));
      loose = pool.filter(x => ids.has(x.id));
    } catch (e){ tlog('⚠ кандидаты через ИИ не удались: ' + e.message); }
  }
  const candidates = [...exact, ...loose].filter(x => x.id !== t.id);
  if (!candidates.length) return html;
  for (let attempt = 1; attempt <= 2; attempt++){
    const linked = await step(steps, 'ссылки', P.AI_PROMPT_LINKS, 'Список тем-кандидатов:\n' + candidateLines(candidates) + '\n\nHTML-фрагмент описания:\n' + html, M_PLAIN, tlog);
    const sanitized = sanitizeLinks(stripCodeFences(linked), t.id);
    // The link pass may only wrap words in <a>; if the visible text moved,
    // it rewrote something — never let that slip through.
    if (normText(sanitized) === normText(html)) return sanitized;
    tlog('⚠ этап ссылок изменил текст (попытка ' + attempt + ')');
  }
  tlog('⚠ ссылки не расставлены — текст оставлен без ссылок');
  return html;
}

async function pipelineGenerate(t, steps, tlog, action){
  const sec = P.aiSection(sectionOf(t));
  let formatted;
  if (t.type === 'folder'){
    const children = kids(t).map(c => c.title);
    const raw = await step(steps, 'обзор раздела', P.aiPromptGenerateFolder(sec), 'Раздел: ' + t.title + (children.length ? '\nНепосредственно входящие темы: ' + children.join(', ') : ''), M_THINK, tlog);
    formatted = await step(steps, 'форматирование', P.aiPromptFormat(sec), raw, M_PLAIN, tlog);
  } else {
    const userMsg = contextMsg(t) + philosophyNote(t, action);
    const raw = await step(steps, 'генерация', P.aiPromptGenerate(sec), userMsg, M_GEN, tlog);
    const checked = await step(steps, 'проверка', P.aiPromptCheck(sec), 'Название темы: ' + t.title + '\n\nОписание:\n' + raw, M_THINK, tlog);
    formatted = await step(steps, 'форматирование', P.aiPromptFormat(sec), checked, M_PLAIN, tlog);
  }
  formatted = await fixKatex(stripCodeFences(formatted), steps, tlog);
  formatted = await ensureFormulas(formatted, steps, tlog);
  return addLinks(t, formatted, steps, tlog);
}

async function pipelineEdit(t, issues, steps, tlog){
  issues = issues.filter(i => !bogusIssue(i));
  const sec = P.aiSection(sectionOf(t));
  const source = stripLinks(stripCodeFences(t.description));
  let userMsg = contextMsg(t) + philosophyNote(t);
  userMsg += '\n\nНедостатки, найденные главным редактором:\n' + (issues.length ? issues.map(i => '- ' + i).join('\n') : '- (конкретных нет — проверь по правилам)');
  userMsg += '\n\nHTML-фрагмент статьи:\n' + source;
  let html = stripCodeFences(await step(steps, 'правка', aiPromptRevise(t, sec), userMsg, M_GEN, tlog));
  // Nothing to normalize in an article without a single formula.
  if (html.includes('$')) html = stripCodeFences(await step(steps, 'нормализация формул', P.AI_PROMPT_NORMALIZE_FORMULAS, html, M_PLAIN, tlog));
  html = await fixKatex(html, steps, tlog);
  html = await ensureFormulas(html, steps, tlog);
  return addLinks(t, html, steps, tlog);
}

/* ---------------- running ---------------- */
async function pool(items, conc, fn){
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(conc, items.length) }, async () => {
    while (i < items.length){ const it = items[i++]; await fn(it, i); }
  }));
}

async function processTopic(t, action, n, total, dry){
  const tlog = m => log('[' + n + '/' + total + '] «' + t.title + '» ' + m);
  const steps = []; const t0 = Date.now();
  tlog('→ ' + action);
  try {
    let html, lastErr;
    for (let attempt = 1; attempt <= 3 && html === undefined; attempt++){
      try {
        if (action === 'edit') html = await pipelineEdit(t, (state.triage[t.id] || {}).issues || [], steps, tlog);
        else if (action === 'links') html = await addLinks(t, stripCodeFences(t.description), steps, tlog);
        else html = await pipelineGenerate(t, steps, tlog, action);
        if (!hasText(html)){ html = undefined; throw new Error('пустой результат'); }
      } catch (e){ lastErr = e; tlog('⚠ попытка ' + attempt + ' не удалась: ' + e.message); }
    }
    if (html === undefined) throw lastErr;
    const before = t.description || '';
    fs.writeFileSync(path.join(RESULTS_DIR, t.id + '.json'), JSON.stringify({ id: t.id, title: t.title, action, before, after: html, steps }, null, 1));
    if (dry){ console.log('\n' + html + '\n'); return; }
    t.description = html;
    state.done[t.id] = { action, at: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000) };
    delete state.failed[t.id];
    saveState(); await saveConfig();
    tlog('✓ готово за ' + Math.round((Date.now() - t0) / 1000) + ' с, ссылок: ' + (html.match(/href="topic:/g) || []).length);
  } catch (e){
    state.failed[t.id] = { action, error: e.message, at: new Date().toISOString() };
    saveState();
    tlog('✗ ошибка: ' + e.message);
  }
}

async function triageTopic(t, n, total){
  const sec = P.aiSection(sectionOf(t));
  const anc = ancestors(t); const parent = anc[anc.length - 1];
  let msg = 'Название: ' + t.title + '\nТип: ' + (TYPE_LABELS[t.type] || t.type);
  if (anc.length) msg += '\nПуть: ' + anc.map(a => a.title).join(' › ');
  if (parent && hasText(parent.description)) msg += '\nОписание родителя «' + parent.title + '» (текстом):\n' + htmlToPlain(parent.description).slice(0, 2500);
  msg += '\n\nСтатья (HTML):\n' + t.description;
  for (let attempt = 1; attempt <= 3; attempt++){
    try {
      const raw = await dsComplete(aiPromptTriage(t, sec), msg, { model: process.env.TRIAGE_MODEL || M_PLAIN, log: m => log('[' + n + '] ' + m) });
      const j = parseLooseJson(raw);
      if (!['keep', 'edit', 'rewrite'].includes(j.verdict)) throw new Error('неизвестный вердикт ' + j.verdict);
      state.triage[t.id] = { verdict: j.verdict, issues: (j.issues || []).slice(0, 8), fit: +(j.philosophy && j.philosophy.fit) || 0, idea: (j.philosophy && j.philosophy.idea) || '' };
      saveState();
      log('[' + n + '/' + total + '] «' + t.title + '» → ' + j.verdict + (state.triage[t.id].fit >= 2 ? ' (философия ' + state.triage[t.id].fit + ')' : ''));
      return;
    } catch (e){ log('[' + n + '/' + total + '] «' + t.title + '» ' + (attempt < 3 ? '⚠' : '✗') + ' сортировка (попытка ' + attempt + '/3): ' + e.message); }
  }
}

// Models quote LaTeX inside the JSON strings (\( , \frac …) — invalid JSON
// escapes. Cut the object out of any surrounding chatter and double every
// backslash that doesn't start a legal JSON escape before parsing.
function parseLooseJson(raw){
  const body = stripCodeFences(raw).replace(/^json\s*/i, '').replace(/^[^{]*/, '').replace(/[^}]*$/, '');
  try { return JSON.parse(body); }
  catch { return JSON.parse(body.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')); }
}

const conc = +opt('conc', 3);
const limit = +opt('limit', 1e9);

if (cmd === 'empty'){
  const list = topics.filter(t => !hasText(t.description) && !state.done[t.id]).slice(0, limit);
  log('== пустые темы: ' + list.length);
  await pool(list, conc, (t, n) => processTopic(t, 'empty', n, list.length));
} else if (cmd === 'triage'){
  const list = topics.filter(t => hasText(t.description) && !state.triage[t.id] && !state.done[t.id]).slice(0, limit);
  log('== сортировка: ' + list.length);
  await pool(list, conc, (t, n) => triageTopic(t, n, list.length));
} else if (cmd === 'pick-philosophy'){
  // Keeps the detail rare site-wide: only the strongest candidates, capped.
  const max = +opt('max', 110);
  const cands = Object.entries(state.triage).filter(([, v]) => v.fit >= 2 && v.idea).sort((a, b) => b[1].fit - a[1].fit);
  state.philosophy = {};
  cands.slice(0, max).forEach(([id, v]) => { state.philosophy[id] = v.idea; });
  saveState();
  log('== философская деталь назначена: ' + Object.keys(state.philosophy).length + ' из кандидатов ' + cands.length);
} else if (cmd === 'process'){
  const only = opt('only', null);
  const list = [];
  topics.forEach(t => {
    const tr = state.triage[t.id]; if (!tr || state.done[t.id]) return;
    let action = tr.verdict === 'keep' ? (state.philosophy[t.id] ? 'edit' : (/href="topic:/.test(t.description) ? null : 'links')) : tr.verdict;
    if (!action || (only && action !== only && !(only === 'keep' && action === 'links'))) return;
    list.push([t, action]);
  });
  const sel = list.slice(0, limit);
  log('== обработка: ' + sel.length + ' (' + ['rewrite', 'edit', 'links'].map(a => a + ' ' + sel.filter(x => x[1] === a).length).join(', ') + ')');
  await pool(sel, conc, ([t, action], n) => processTopic(t, action, n, sel.length));
} else if (cmd === 'one'){
  const t = byId.get(rest[0]); if (!t) throw new Error('нет темы ' + rest[0]);
  if (rest[1] === 'edit' && !state.triage[t.id]) await triageTopic(t, 1, 1);
  if (rest[1] === 'edit') console.log(JSON.stringify(state.triage[t.id], null, 1));
  await processTopic(t, rest[1] || 'empty', 1, 1, true);
} else if (cmd === 'all'){
  // Up to --workers topics at once; how many requests actually hit DeepSeek
  // at the same time is decided by the adaptive limiter in ds-client.mjs
  // (1…7, backs off on "server is busy" / rate limiting). Tree order: a topic
  // is only started once none of its ancestors is still pending or in work,
  // so a parent is always finished before its children read its description.
  const maxPh = +opt('max-philosophy', 110);
  const workers = Math.max(1, +opt('workers', 30));
  const pending = topics.filter(t => !state.done[t.id]);
  const total = pending.length;
  const busyIds = new Set();
  let n = 0, wake = () => {};
  log('== полный проход: осталось ' + total + ' тем, потоков тем до ' + workers);
  const blocked = t => ancestors(t).some(a => busyIds.has(a.id) || (!state.done[a.id] && pending.includes(a)));
  async function handle(t, k){
    if (!hasText(t.description)){ await processTopic(t, 'empty', k, total); return; }
    if (!state.triage[t.id]) await triageTopic(t, k, total);
    const tr = state.triage[t.id]; if (!tr) return;
    if (tr.fit >= 3 && tr.idea && !state.philosophy[t.id] && Object.keys(state.philosophy).length < maxPh){ state.philosophy[t.id] = tr.idea; saveState(); }
    const action = tr.verdict !== 'keep' ? tr.verdict : state.philosophy[t.id] ? 'edit' : (/href="topic:/.test(t.description) ? null : 'links');
    if (action) await processTopic(t, action, k, total);
    else { state.done[t.id] = { action: 'keep', at: new Date().toISOString() }; saveState(); }
  }
  await Promise.all(Array.from({ length: workers }, async () => {
    for (;;){
      if (!pending.length) return;
      const i = pending.findIndex(t => !blocked(t));
      if (i < 0){ await new Promise(r => { const prev = wake; wake = () => { prev(); r(); }; }); continue; }
      const [t] = pending.splice(i, 1);
      busyIds.add(t.id);
      try { await handle(t, ++n); }
      finally { busyIds.delete(t.id); const w = wake; wake = () => {}; w(); }
    }
  }));
  log('== полный проход завершён');
} else if (cmd === 'triage-test'){
  const t = byId.get(rest[0]); const t0 = Date.now();
  await triageTopic(t, 1, 1);
  console.log(((Date.now() - t0) / 1000) + ' с', JSON.stringify(state.triage[t.id], null, 1));
  delete state.triage[t.id]; saveState();
} else if (cmd === 'stats'){
  const tri = Object.values(state.triage); const c = {};
  tri.forEach(v => c[v.verdict] = (c[v.verdict] || 0) + 1);
  console.log({ всего: topics.length, пустых: topics.filter(t => !hasText(t.description)).length, отсортировано: tri.length, ...c,
    философия: Object.keys(state.philosophy).length, обработано: Object.keys(state.done).length, ошибок: Object.keys(state.failed).length });
} else {
  console.log('команды: empty | triage | pick-philosophy | process | one <id> <action> | stats');
}
await saveChain;
// ds-client keeps timers alive (a run may be waiting for a paused or
// re-logged account), so the process has to be ended explicitly.
process.exit(0);
