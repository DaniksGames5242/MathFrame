// assets/js/playground.js
// Песочница GMS (/playground/): редактор с подсветкой и подсказками, живой просмотр
// сцены, примеры справочника, сохранение/обмен кодом и документация языка
// (data/gms-docs/reference.md). Компилирует тот же assets/js/gms-compiler.js, что и
// справочник, поэтому сцена здесь выглядит ровно так же, как на странице темы.
import { compile } from './gms-compiler.js';
import { mountInline } from './gms-inline.js';

const $ = (id) => document.getElementById(id);
const code = $('code'), hl = $('hl'), gutter = $('gutter'), errsEl = $('errs');
const statusEl = $('status'), prevEmpty = $('prevEmpty');
let sceneHost = $('sceneHost');
const consoleEl = $('console'), sug = $('sug');

const LS_CODE = 'mf-playground-code';
const LS_AUTO = 'mf-playground-auto';
const LS_NAME = 'mf-playground-name';
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};

/* ==========================================================================
   Шаблоны
   ========================================================================== */
const TEMPLATES = {
  'Пустая 2D-сцена': `[
description = "Описание сцены"
show description = true;

field width = 20; field height = 12;
camera type = fixed;
show axes = true;
show grid = true;

new Point { name = "A"; pos = (0, 0); text = true("A") }
]`,
  'Треугольник и углы': `[
description = "Сумма углов треугольника: **{sum}°**"
show description = true;

new Point { name = "A"; pos = (-5, -3); text = true("A") }
new Point { name = "B"; pos = (5, -3); text = true("B") }
new Point { name = "C"; pos = (0, 4); text = true("C") }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Line { name = "ac"; pos = (A, C) }
new Line { name = "ba"; pos = (B, A) }
new Line { name = "cb"; pos = (C, B) }
new Angle { name = "angA"; lines = (ab, ac) }
new Angle { name = "angB"; lines = (bc, ba) }
new Angle { name = "angC"; lines = (ca, cb) }
draw Angle { name = "dA"; angle = "angA"; count = 1 }
draw Angle { name = "dB"; angle = "angB"; count = 2 }
draw Angle { name = "dC"; angle = "angC"; count = 3 }

string sum = "";
Update { sum = format(angA.measure + angB.measure + angC.measure, 1); }
]`,
  'График с ползунками': `[
description = "y = a·sin(b·x) при a = {a}, b = {b}"
show description = true;

float a = 2; float b = 1;
func f(x) = a * sin(b * x);
draw Function { name = "gr"; f = "f" }
new UI { name = "sa"; type = slider; label = "a"; variable = a; min = -4; max = 4; step = 0.1 }
new UI { name = "sb"; type = slider; label = "b"; variable = b; min = 0.2; max = 4; step = 0.1 }

show axes = true; show grid = true;
]`,
  'Вкладки': `[
description = "{info}"
show description = true;

float tab = 1;
string info = "";
new Point { name = "A"; pos = (-3, 0); text = true("A") }
new Point { name = "B"; pos = (3, 0); text = true("B") }
new Line { name = "ab"; pos = (A, B) }
new Circle { name = "c"; center = A; radius = 3 }
new Claster { name = "t1"; elements = (B, ab); active = true }
new Claster { name = "t2"; elements = (c); active = false }
new UI { name = "b1"; type = button; label = "Отрезок"; action = "tab = 1; t1.active = true; t2.active = false" }
new UI { name = "b2"; type = button; label = "Окружность"; action = "tab = 2; t1.active = false; t2.active = true" }

Update {
  if (tab == 1) { info = "**Отрезок** AB, длина " + format(ab.length, 2); }
  else { info = "**Окружность** с центром A"; }
}
]`,
  '3D-сцена': `[
description = "Перетаскивайте вершины; вращайте сцену мышью"
show description = true;

field width = 10; field height = 8; field depth = 10;
camera start rot = (30, 70);
show axes = true;

new Point3D { name = "A"; pos = (-2, -1, -2); text = true("A") }
new Point3D { name = "B"; pos = (3, -1, -1); text = true("B") }
new Point3D { name = "C"; pos = (0, -1, 3); text = true("C") }
new Point3D { name = "D"; pos = (0, 3, 0); text = true("D") }
new Line3D { name = "ab"; pos = (A, B) }
new Line3D { name = "bc"; pos = (B, C) }
new Line3D { name = "ca"; pos = (C, A) }
new Line3D { name = "ad"; pos = (A, D) }
new Line3D { name = "bd"; pos = (B, D) }
new Line3D { name = "cd"; pos = (C, D) }
]`,
  'Анимация': `[
description = "Точка движется по окружности, угол {deg}°"
show description = true;

float phi = 0;
string deg = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; text = true("O") }
new Point { name = "P"; pos = (4, 0); dynamic = false; text = true("P") }
new Line { name = "op"; pos = (O, P) }
new Circle { name = "w"; center = O; radius = 4 }

Start { animate("phi", 360, 6, "linear", 0, "loop"); }
Update {
  P.pos.x = 4 * cos(radians(phi));
  P.pos.y = 4 * sin(radians(phi));
  deg = format(phi, 0);
}
show axes = true;
]`,
  'Граф': `[
description = "Полный граф K{n}: {e} рёбер"
show description = true;

float n = 5; float built = 0; float g = 0;
string e = "";
draw Graph { name = "dg"; graph = "g"; showWeights = false }
new UI { name = "s"; type = slider; label = "n"; variable = n; min = 2; max = 9; step = 1 }
Update {
  if (built != n) {
    built = n;
    g = newGraph();
    repeat (n) { addNode(g, "v" + i, [4 * cos(2*pi*i/n), 4 * sin(2*pi*i/n)], "" + (i + 1)); }
    repeat (n) { float a = i; repeat (n) { if (i > a) { addEdge(g, "v" + a, "v" + i); } } }
    e = "" + nCr(n, 2);
  }
}
]`,
};

/* ==========================================================================
   Подсветка синтаксиса
   ========================================================================== */
const TYPE_WORDS = ['Point2D','Point3D','Point','Line2D','Line3D','Line','Figure2D','Figure3D','Figure',
  'Primitive','Section','Boolean','Truncate','Hull','Minkowski','Angle3D','Claster2D','Claster3D','Claster','Angle','EquallySing',
  'Vector2D','Vector3D','Vector','InfLine','InfPlane','Filling2D','Filling3D','Filling','Punctir',
  'Text2D','Text3D','Text','UI','Circle','Arc','Ellipse','Curve2D','Curve3D','Curve',
  'Surface2D','Surface3D','Surface','Image','Histogram3D','Histogram','Field2D','Field3D','Field','TensorField',
  'Trajectory2D','Trajectory3D','Trajectory','Graph','Fractal','Formula','Distribution','Locus','Trace','Region',
  'Chart','Tree','Table','Complex','Hyperbolic','Bifurcation','Cobweb','IFS','Automaton','Voronoi',
  'Fourier','Diagram','Scatter3D'];
const PREFIX_WORDS = ['new','draw','func','Void','Function','Start','Update','if','else','repeat','while','for','in','wait','return','set'];
const DECL_WORDS = ['int','float','string','bool','Vector2','color','list'];
const sortLen = (a) => a.slice().sort((x, y) => y.length - x.length).join('|');
const TOKEN_RE = new RegExp(
  '(//[^\\n]*|/\\*[\\s\\S]*?\\*/)' +
  '|("(?:[^"\\\\\\n]|\\\\.)*"?)' +
  '|(#[0-9a-fA-F]{6}\\b|#[0-9a-fA-F]{3}\\b)' +
  '|(\\b\\d+(?:\\.\\d+)?\\b)' +
  '|((?<=\\bdraw\\s+)Function\\b|\\b(?:' + sortLen(TYPE_WORDS) + ')\\b)' +
  '|(\\b(?:' + PREFIX_WORDS.join('|') + ')\\b)' +
  '|(\\b(?:' + DECL_WORDS.join('|') + ')\\b)' +
  '|(\\b(?:true|false)\\b)' +
  '|(\\b[A-Za-z_][A-Za-z0-9_]*\\b(?=\\s*=(?!=)))', 'g');
const CLS = [null, 't-com', 't-str', 't-col', 't-num', 't-type', 't-kw', 't-decl', 't-bool', 't-key'];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function highlight(src) {
  let out = '', last = 0, m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(src))) {
    if (m.index === TOKEN_RE.lastIndex) TOKEN_RE.lastIndex++;
    out += esc(src.slice(last, m.index));
    let g = 1; while (g < CLS.length && m[g] === undefined) g++;
    const t = esc(m[0]);
    out += g === 3 ? `<span class="t-col" style="text-decoration-color:${m[0]}">${t}</span>` : `<span class="${CLS[g]}">${t}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(src.slice(last)) + '\n';
}

let errorLines = new Set();
function renderEditor() {
  hl.innerHTML = highlight(code.value);
  const n = code.value.split('\n').length;
  let g = '';
  for (let i = 1; i <= n; i++) g += (errorLines.has(i) ? `<span class="e">${i}</span>` : i) + '\n';
  gutter.innerHTML = g;
  syncScroll();
}
function syncScroll() {
  hl.scrollTop = code.scrollTop; hl.scrollLeft = code.scrollLeft;
  const fm = $('fm'); if (fm) { fm.scrollTop = code.scrollTop; fm.scrollLeft = code.scrollLeft; }
  gutter.scrollTop = code.scrollTop;
}
code.addEventListener('scroll', syncScroll);

/* ==========================================================================
   Компиляция и просмотр
   ========================================================================== */
let lastHtml = null;
let autoRun = store.get(LS_AUTO) !== 'off';
const siteTheme = () => (document.documentElement.classList.contains('light') ? 'light' : 'dark');
// Песочница компилирует в своём профиле (assets/js/gms/playground.js): сцена на всю
// область, описание — только по show description = true, тема — из кода
// (theme = auto по умолчанию — тема сайта). Справочник компилирует без опций.
const compileScene = (src) => compile(src, { target: 'playground', theme: siteTheme() });

function lineOf(msg) {
  const m = String(msg).match(/строка\s+(\d+)/);
  return m ? +m[1] : null;
}
function setStatus(ok, text) {
  statusEl.className = 'status ' + (ok ? 'ok' : 'err');
  statusEl.textContent = text;
}

// Сцена показывается прямо на странице, без iframe (assets/js/gms-inline.js).
let scene = null, mountSeq = 0;
function sceneError(text) {
  if (consoleEl.childElementCount > 30) return;
  const d = document.createElement('div');
  d.textContent = '⚠ ' + text;
  consoleEl.appendChild(d);
}
async function mountScene(html) {
  const seq = ++mountSeq;
  if (scene) { scene.destroy(); scene = null; }
  consoleEl.innerHTML = '';
  // новый элемент-хост на каждый запуск: у старого остаётся тень прошлой сцены
  const host = document.createElement('div');
  host.className = 'scene-host';
  sceneHost.replaceWith(host); sceneHost = host;
  const m = await mountInline(host, html, { onError: sceneError });
  if (seq !== mountSeq) { m.destroy(); return; }
  scene = m;
  prevEmpty.hidden = true;
}
// theme = auto: сцена следует за темой сайта (у явной light/dark — переключатель внутри
// сцены ничего не меняет: geocompilerSetTheme вызывается только для auto).
new MutationObserver(() => { if (scene && sceneThemeAuto) scene.setTheme(siteTheme()); })
  .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
let sceneThemeAuto = true;

function run(force) {
  let res;
  const t0 = performance.now();
  try { res = compileScene(code.value); }
  catch (e) { res = { success: false, errors: ['Внутренняя ошибка компилятора: ' + e.message] }; }
  const ms = Math.round(performance.now() - t0);
  errsEl.innerHTML = '';
  errorLines = new Set();
  if (!res.success) {
    // Незакрытая или лишняя скобка — самая частая причина непонятных сообщений
    // компилятора («Неизвестный ключ …»), поэтому показываем её первой.
    const br = bracketProblem(code.value);
    if (br && !res.errors.some((e) => e === br)) res.errors.unshift(br);
    for (const e of res.errors) {
      const d = document.createElement('div');
      d.textContent = '✕ ' + e;
      const ln = lineOf(e);
      if (ln) { errorLines.add(ln); d.onclick = () => jumpToLine(ln); }
      errsEl.appendChild(d);
    }
    setStatus(false, res.errors.length + ' ' + plural(res.errors.length, 'ошибка', 'ошибки', 'ошибок'));
    renderEditor();
    return null;
  }
  setStatus(true, '✓ скомпилировано за ' + ms + ' мс');
  renderEditor();
  if (force || res.html !== lastHtml) {
    lastHtml = res.html;
    sceneThemeAuto = /"themeAuto":true/.test(res.html);
    mountScene(res.html).catch((e) => sceneError(e.message || e));
  }
  return res.html;
}
// Проверка парности скобок ( ) [ ] { } без учёта строк и комментариев.
function bracketProblem(src) {
  const OPEN = { '(': ')', '[': ']', '{': '}' }, CLOSE = { ')': '(', ']': '[', '}': '{' };
  const st = []; let line = 1;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\n') { line++; continue; }
    if (ch === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; i--; continue; }
    if (ch === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); const end = e < 0 ? src.length : e + 2; line += (src.slice(i, end).match(/\n/g) || []).length; i = end - 1; continue; }
    if (ch === '"') { i++; while (i < src.length && src[i] !== '"' && src[i] !== '\n') { if (src[i] === '\\') i++; i++; } if (src[i] === '\n') line++; continue; }
    if (OPEN[ch]) st.push({ ch, line });
    else if (CLOSE[ch]) {
      const top = st.pop();
      if (!top) return `Лишняя закрывающая скобка «${ch}» (строка ${line})`;
      if (top.ch !== CLOSE[ch]) return `Скобка «${top.ch}» из строки ${top.line} закрыта скобкой «${ch}» (строка ${line}) — ожидалась «${OPEN[top.ch]}»`;
    }
  }
  if (st.length) { const t = st[st.length - 1]; return `Не закрыта скобка «${t.ch}» (строка ${t.line}) — добавьте «${OPEN[t.ch]}»`; }
  return null;
}
function plural(n, a, b, c) {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c);
}

$('pvReload').onclick = () => run(true);
$('bRun').onclick = () => run(true);
function refreshAuto() { $('bAuto').checked = autoRun; }
$('bAuto').onchange = () => { autoRun = $('bAuto').checked; store.set(LS_AUTO, autoRun ? 'on' : 'off'); if (autoRun) run(); };

let editTimer = null, saveTimer = null;
function onEdit() {
  renderEditor();
  if (!findBar.hidden) findAll(false);
  clearTimeout(saveTimer); saveTimer = setTimeout(() => store.set(LS_CODE, code.value), 300);
  if (autoRun) { clearTimeout(editTimer); editTimer = setTimeout(() => run(), 700); }
}
code.addEventListener('input', () => { if (programmatic) return; onEdit(); updateSuggest(false); });

/* ==========================================================================
   Редактирование: отступы, скобки, комментарии
   ========================================================================== */
let programmatic = false;   // правка из кода: не показывать подсказки на событии input
function replaceRange(start, end, text, selStart, selEnd) {
  code.focus();
  code.setSelectionRange(start, end);
  // execCommand сохраняет историю отмены (Ctrl+Z); если недоступен — прямая замена.
  programmatic = true;
  try {
    if (!document.execCommand || !document.execCommand('insertText', false, text)) {
      code.setRangeText(text, start, end, 'end');
    }
  } finally { programmatic = false; }
  if (selStart !== undefined) code.setSelectionRange(selStart, selEnd === undefined ? selStart : selEnd);
  onEdit();
}
function lineStart(pos) { return code.value.lastIndexOf('\n', pos - 1) + 1; }
function jumpToLine(ln) {
  const lines = code.value.split('\n');
  let pos = 0;
  for (let i = 0; i < ln - 1 && i < lines.length; i++) pos += lines[i].length + 1;
  code.focus();
  code.setSelectionRange(pos, pos + (lines[ln - 1] || '').length);
  code.scrollTop = Math.max(0, (ln - 5) * lineH());
}
// Высота строки берётся из CSS: она меняется вместе с размером шрифта (Ctrl + / Ctrl −).
function lineH() { return parseFloat(getComputedStyle(code).lineHeight) || 19.5; }
function indentSelection(outdent) {
  const v = code.value, s = code.selectionStart, e = code.selectionEnd;
  const a = lineStart(s);
  const block = v.slice(a, e);
  const lines = block.split('\n');
  const out = lines.map((l) => outdent ? l.replace(/^( {1,2}|\t)/, '') : '  ' + l).join('\n');
  replaceRange(a, e, out, a, a + out.length);
}
function toggleComment() {
  const v = code.value, s = code.selectionStart, e = code.selectionEnd;
  const a = lineStart(s);
  let b = v.indexOf('\n', e); if (b < 0) b = v.length;
  const lines = v.slice(a, b).split('\n');
  const all = lines.every((l) => /^\s*\/\//.test(l) || !l.trim());
  const out = lines.map((l) => all ? l.replace(/^(\s*)\/\/ ?/, '$1') : (l.trim() ? l.replace(/^(\s*)/, '$1// ') : l)).join('\n');
  replaceRange(a, b, out, a, a + out.length);
}
const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"' };
code.addEventListener('keydown', (e) => {
  if (sugVisible() && handleSugKey(e)) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 'Enter') { e.preventDefault(); run(true); return; }
  if (mod && (e.key === 's' || e.key === 'ы')) { e.preventDefault(); store.set(LS_CODE, code.value); toast('Сохранено в браузере'); return; }
  if (mod && e.key === '/') { e.preventDefault(); toggleComment(); return; }
  if (mod && e.code === 'Space') { e.preventDefault(); updateSuggest(true); return; }
  if (mod && !e.altKey && (e.key === 'f' || e.key === 'а' || e.key === 'h' || e.key === 'р')) { e.preventDefault(); openFind(e.key === 'h' || e.key === 'р'); return; }
  if (mod && (e.key === 'g' || e.key === 'п')) { e.preventDefault(); goToLine(); return; }
  if (mod && (e.key === 'd' || e.key === 'в')) { e.preventDefault(); duplicateLines(); return; }
  if (e.altKey && !mod && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); moveLines(e.key === 'ArrowUp' ? -1 : 1); return; }
  if (mod && (e.key === '=' || e.key === '+')) { e.preventDefault(); setFont(fontPx + 1); return; }
  if (mod && e.key === '-') { e.preventDefault(); setFont(fontPx - 1); return; }
  if (mod && e.key === '0') { e.preventDefault(); setFont(13); return; }
  if (e.key === 'F1') { e.preventDefault(); openKeys(); return; }
  const s = code.selectionStart, en = code.selectionEnd, v = code.value;
  if (e.key === 'Tab') {
    e.preventDefault();
    if (s !== en && v.slice(s, en).includes('\n')) indentSelection(e.shiftKey);
    else if (e.shiftKey) indentSelection(true);
    else replaceRange(s, en, '  ');
    return;
  }
  if (e.key === 'Enter' && !mod) {
    e.preventDefault();
    const ls = lineStart(s);
    const ind = (v.slice(ls, s).match(/^[ \t]*/) || [''])[0];
    const prev = v[s - 1], next = v[s];
    if ((prev === '{' && next === '}') || (prev === '[' && next === ']')) {
      replaceRange(s, en, '\n' + ind + '  ' + '\n' + ind, s + ind.length + 3);
    } else {
      const extra = (prev === '{' || prev === '[') ? '  ' : '';
      replaceRange(s, en, '\n' + ind + extra);
    }
    return;
  }
  if (PAIRS[e.key] && !mod) {
    if (e.key === '"' && v[s] === '"' && s === en) { e.preventDefault(); code.setSelectionRange(s + 1, s + 1); return; }
    if (s !== en) { e.preventDefault(); replaceRange(s, en, e.key + v.slice(s, en) + PAIRS[e.key], s + 1, en + 1); return; }
    const nx = v[s];
    if (!nx || /[\s)\]};,]/.test(nx)) { e.preventDefault(); replaceRange(s, en, e.key + PAIRS[e.key], s + 1); return; }
  }
  if ((e.key === ')' || e.key === ']' || e.key === '}') && v[s] === e.key && s === en) {
    e.preventDefault(); code.setSelectionRange(s + 1, s + 1); return;
  }
  if (e.key === 'Backspace' && s === en && s > 0 && PAIRS[v[s - 1]] === v[s]) {
    e.preventDefault(); replaceRange(s - 1, s + 1, ''); return;
  }
  if (e.key === '}' && s === en) {
    const ls = lineStart(s);
    if (/^\s+$/.test(v.slice(ls, s))) { e.preventDefault(); const ind = v.slice(ls, s).replace(/ {1,2}$/, ''); replaceRange(ls, s, ind + '}'); return; }
  }
});
// Границы целых строк, задетых выделением: [a, b) без последнего перевода строки.
function selLines() {
  const v = code.value, s = code.selectionStart, e = code.selectionEnd;
  const a = lineStart(s);
  let b = v.indexOf('\n', e > s && v[e - 1] === '\n' ? e - 1 : e); if (b < 0) b = v.length;
  return { a, b };
}
function duplicateLines() {
  const { a, b } = selLines(), v = code.value, block = v.slice(a, b);
  const s = code.selectionStart, e = code.selectionEnd, d = block.length + 1;
  replaceRange(b, b, '\n' + block, s + d, e + d);
}
function moveLines(dir) {
  const { a, b } = selLines(), v = code.value, s = code.selectionStart, e = code.selectionEnd;
  if (dir < 0) {
    if (a === 0) return;
    const pa = lineStart(a - 1), prev = v.slice(pa, a - 1), block = v.slice(a, b);
    const d = prev.length + 1;
    replaceRange(pa, b, block + '\n' + prev, s - d, e - d);
  } else {
    if (b >= v.length) return;
    let nb = v.indexOf('\n', b + 1); if (nb < 0) nb = v.length;
    const next = v.slice(b + 1, nb), block = v.slice(a, b), d = next.length + 1;
    replaceRange(a, nb, next + '\n' + block, s + d, e + d);
  }
}
function goToLine() {
  const n = code.value.split('\n').length;
  const r = prompt('Перейти к строке (1–' + n + '):', '');
  const ln = parseInt(r, 10);
  if (ln >= 1) jumpToLine(Math.min(ln, n));
}
// Размер шрифта редактора: Ctrl + / Ctrl − / Ctrl 0, запоминается.
const LS_FONT = 'mf-playground-font';
let fontPx = +store.get(LS_FONT) || 13;
function setFont(px) {
  fontPx = Math.max(10, Math.min(24, px));
  const ed = code.closest('.ed');
  ed.style.fontSize = fontPx + 'px'; ed.style.lineHeight = (fontPx * 1.5) + 'px';
  _cw = 0; store.set(LS_FONT, String(fontPx));
  renderEditor();
}
$('bFormat').onclick = () => {
  let depth = 0;
  const out = code.value.split('\n').map((raw) => {
    const l = raw.trim();
    const noStr = l.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/\/\/.*$/, '');
    const lead = (noStr.match(/^[}\]]+/) || [''])[0].length;
    const d = Math.max(0, depth - lead);
    for (const ch of noStr) { if (ch === '{') depth++; else if (ch === '}') depth = Math.max(0, depth - 1); }
    // Верхний уровень программы — внутри [ ]: отступ не добавляем, как в примерах справочника.
    return l ? '  '.repeat(d) + l : '';
  }).join('\n');
  replaceRange(0, code.value.length, out, 0);
};

/* ==========================================================================
   Подсказки: ключевые слова, типы, поля текущего блока, функции, имена
   ========================================================================== */
const FIELDS = {
  Point:'name pos text textDir dynamic active size textSize shape layer pauseOnDrag color textColor line circle ellipse arc curve graph plane figure t u v extend construct vertex base reflect over rotate around angle axis homothety center ratio ratioY ratioZ translate dx dy dz collision collisionGroup collisionMask collisionMargin collideWithPoints collideWithLines collideWithCircles collideWithCurves collideWithFigures collideWithBoundary',
  Line:'name pos thickness interact active layer color reflect over rotate around angle homothety center ratio translate dx dy',
  Figure:'name elements rotate size sizeX sizeY flipX flipY interact active',
  Angle:'name lines lock angle count arc measure fractions radius side arccolor measurecolor layer',
  Circle:'name center radius points type thickness color active layer',
  Arc:'name center from to points radius thickness color active layer',
  Ellipse:'name center a b rotate focus1 focus2 points thickness dynamic active layer color',
  Curve:'name type x y z points center start turns a b radius segments thickness colorBy showFrenet frenetCount frenetScale active layer color',
  Claster:'name elements active interact rotate step',
  UI:'name type label variable default min max step action inputtype options labels funcName x y width height radius stepper active layer color textcolor',
  Text:'name pos text size align active layer color',
  Vector:'name edge pos length thickness layer color',
  Punctir:'name edge pattern thickness active layer color',
  InfLine:'name edge dotline limit thickness layer color',
  InfPlane:'name figure points opacity grid fade size active layer color',
  EquallySing:'name edges type layer color',
  Filling:'name figure line side circle shape arc from to bfunc bfunc2 xmin xmax segments mode opacity layer color',
  Function:'name f xmin xmax segments extend extendDistance grid gridStep mode thickness active layer color',
  Surface:'name type mode f x y z xmin xmax ymin ymax zmin zmax umin umax vmin vmax grid levels level opacity angle active layer color',
  Field:'name P Q R xmin xmax ymin ymax zmin zmax grid scale active layer color',
  Trajectory:'name system field P Q R start steps dt thickness active layer color',
  Graph:'name graph directed labels showWeights nodeRadius edgeWidth edgeCap highlight highlightEdges highlightColor nodeColor edgeColor labelColor pos rotate billboard panelWidth panelHeight active layer',
  Region:'name f op f2 op2 combine rangeX rangeY level level2 border quality opacity active layer color',
  Locus:'name point driver from to samples dashed thickness active layer color',
  Trace:'name point maxPoints minDist fade thickness active layer color',
  Formula:'name pos latex text size display background align active layer color',
  Image:'name src pos width height rotate opacity billboard active layer',
  Chart:'name type data labels width height radius pointSize regression showValues showAxes markers horizontal innerRadius startAngle explode labelSize labelColor pos rotate billboard active layer color',
  Histogram:'name data bins width height pos rotate billboard panelWidth panelHeight active layer color',
  Distribution:'name type mu sigma n p lambda a b xmin xmax kmax segments filled highlightFrom highlightTo highlightColor highlightOpacity thickness opacity active layer color',
  Table:'name data header borders cellWidth cellHeight fontSize headerBg borderColor align pos rotate billboard panelWidth panelHeight active layer color',
  Tree:'name data spacing levelGap nodeRadius boxed edgeColor labelColor pos rotate billboard panelWidth panelHeight active layer color',
  Fractal:'name type cRe cIm centerRe centerIm scale maxIter quality palette power iterations size opacity pos rotate billboard panelWidth panelHeight active layer color color2',
  Bifurcation:'name f rmin rmax ymin ymax x0 skip keep quality box pos panelWidth panelHeight active layer color',
  Cobweb:'name f x0 xmin xmax steps showDiagonal curveColor pos panelWidth panelHeight active layer color',
  IFS:'name maps iterations pointSize scale pos active layer color',
  Automaton:'name type rule cells steps cellSize init generation pos panelWidth panelHeight active layer color',
  Voronoi:'name sites mode filled showSites quality opacity rangeX rangeY rangeZ resolution active layer color',
  Fourier:'name path terms speed showCircles circleColor active layer color',
  Diagram:'name nodes arrows accepting curved boxed nodeRadius arrowColor labelColor active layer color',
  Complex:'name f mode centerRe centerIm scale contours quality opacity pos panelWidth panelHeight active layer',
  Hyperbolic:'name model tiling geodesics points depth radius showBoundary tileColor thickness active layer color',
  Primitive:'name type pos rotate edge width height depth radius tube sides opacity wireframe showInfo roughness metalness flatShading segments interactive active color textColor textSize',
  Section:'name source normal offset point keep explode capColor opacity wireframe showInfo hideSource active color',
  Boolean:'name op parts opacity wireframe showInfo hideSource active color',
  Truncate:'name source fraction opacity wireframe showInfo hideSource active color',
  Hull:'name parts opacity wireframe showInfo hideSource active color',
  Minkowski:'name parts opacity wireframe showInfo hideSource active color',
  Angle3D:'name type vec1 vec2 radius count arc measure fractions arccolor measurecolor active',
  TensorField:'name Txx Tyy Tzz Txy Txz Tyz xmin xmax ymin ymax zmin zmax grid scale colorBy active layer color',
  Scatter3D:'name data pos pointSize colorBy showBox shape active layer color',
  Histogram3D:'name data binsX binsY pos width depth heightScale xmin xmax ymin ymax colorBy showAxes active layer color',
};
const BUILTINS = ('abs sign sqrt cbrt exp log log2 log10 logBase pow sin cos tan asin acos atan atan2 sinh cosh tanh radians degrees floor ceil round trunc fract roundTo clamp lerp min max mod hypot ' +
  'format str num latex len push pop sum prod minOf maxOf mean median variance stddev quantile correlation sortAsc reverse unique range linspace map filter random randomInt randomNormal randomChoice ' +
  'gcd lcm isPrime primeFactors divisors factorize primesUpTo nextPrime eulerPhi modPow modInv crt factorial nCr nPr catalan bell stirling1 stirling2 partitionCount permutationsOf combinationsOf powerSet rat ratStr ' +
  'binomialPmf poissonPmf normalPdf normalCdf normalQuantile erf derivative derivative2 integral solve bisect findRoots solveSystem limitAt sumSeries odeSolve gradient interpolate fitLinear fitPolynomial ' +
  'simplify expand factorPoly diff integrate integrateDefinite limit series subst evalAt dot cross norm normalize transpose det inv trace rank identity solveLinear eigenvalues eigenvectors complex re im arg conj ' +
  'distance pointDistance intersection polygonArea polygonCentroid pointInPolygon convexHull rotate translate scale reflect polar toPolar newGraph addNode addEdge shortestPath bfs dfs graphMST graphColoring ' +
  'animate stopAnimation isAnimating animationProgress isKeyDown redraw exportImage').split(' ');
const SCENE_KEYS = ['description', 'field width', 'field height', 'field depth', 'camera type', 'camera start rot', 'camera start zoom', 'show axes', 'show grid', 'grid size', 'theme', 'snap'];
const VALUE_HINTS = {
  type: { UI: 'slider button toggle input select', Circle: 'FromRadius FromPoints', Curve: 'parametric bezier spiral cycloid involute',
    Surface: 'heightfield parametric implicit', Chart: 'scatter line bar pie box', Distribution: 'normal binomial poisson exponential uniform',
    Fractal: 'mandelbrot julia burningship mandelbulb mengersponge sierpinski3d', Automaton: 'elementary life',
    Primitive: 'cube box sphere cylinder cone pyramid prism tetrahedron octahedron dodecahedron icosahedron torus',
    Angle3D: 'lineLine linePlane planePlane dihedral pointAngle vectorVector solid' },
  inputtype: 'text number formula', mode: '3d contour', op: 'union intersect subtract', 'camera type': 'fixed pan orbit',
};
const SNIPPETS = {
  'new Point': 'new Point { name = "P"; pos = (0, 0); text = true("P") }',
  'new Line': 'new Line { name = "ab"; pos = (A, B) }',
  'new Circle': 'new Circle { name = "c"; center = O; radius = 3 }',
  'new UI slider': 'new UI { name = "s"; type = slider; label = "a"; variable = a; min = 0; max = 10; step = 0.1 }',
  'new UI button': 'new UI { name = "b"; type = button; label = "Кнопка"; action = "a = 0" }',
  'draw Function': 'draw Function { name = "gr"; f = "f" }',
  'Update': 'Update {\n  \n}',
  'Start': 'Start {\n  \n}',
  'Function': 'Function name(x) {\n  return x;\n}',
};

let sugItems = [], sugSel = 0, sugRange = null;
function sugVisible() { return sug.style.display === 'block'; }
function hideSug() { sug.style.display = 'none'; sugItems = []; }
function blockContext(pos) {
  // Ищем незакрытую «{» слева и заголовок перед ней: new/draw Тип.
  const v = code.value;
  let depth = 0;
  for (let i = pos - 1; i >= 0; i--) {
    const ch = v[i];
    if (ch === '}') depth++;
    else if (ch === '{') {
      if (depth === 0) {
        const head = v.slice(Math.max(0, i - 60), i);
        const m = head.match(/\b(new|draw)\s+([A-Za-z0-9]+)\s*$/);
        if (!m) return { code: true };
        const type = m[2].replace(/(2D|3D)$/, '').replace(/^Vector$/, 'Vector');
        return { type: m[1] === 'draw' && type === 'Angle' ? 'Angle' : type, start: i };
      }
      depth--;
    }
  }
  return null;
}
function namesInCode() {
  const s = new Set(); let m;
  const re1 = /\bname\s*=\s*"?([A-Za-z_][A-Za-z0-9_]*)/g; while ((m = re1.exec(code.value))) s.add(m[1]);
  const re2 = /\b(?:float|int|string|bool|list|Vector2|color)\s+([A-Za-z_][A-Za-z0-9_]*)/g; while ((m = re2.exec(code.value))) s.add(m[1]);
  const re3 = /\b(?:func|Function|Void)\s+([A-Za-z_][A-Za-z0-9_]*)/g; while ((m = re3.exec(code.value))) s.add(m[1]);
  return [...s];
}
function updateSuggest(force) {
  const pos = code.selectionStart;
  if (pos !== code.selectionEnd) return hideSug();
  const v = code.value;
  const lineHead = v.slice(lineStart(pos), pos);
  if ((lineHead.match(/"/g) || []).length % 2 === 1 || /\/\//.test(lineHead)) return hideSug();
  const wm = lineHead.match(/[A-Za-z_][A-Za-z0-9_]*$/);
  const word = wm ? wm[0] : '';
  if (!force && word.length < 1) return hideSug();
  const ctx = blockContext(pos);
  let items = [];
  // Значение после «поле =»
  const vm = lineHead.match(/([A-Za-z]+)\s*=\s*([A-Za-z0-9]*)$/);
  if (ctx && ctx.type && vm && VALUE_HINTS[vm[1]]) {
    const h = VALUE_HINTS[vm[1]];
    const list = typeof h === 'string' ? h : h[ctx.type];
    if (list) items = list.split(' ').map((x) => ({ text: x, hint: vm[1] }));
  } else if (ctx && ctx.type && /(^|[;{]\s*|^\s*)[A-Za-z_]*$/.test(lineHead) && !vm) {
    const used = new Set((v.slice(ctx.start, pos).match(/\b([A-Za-z0-9_]+)\s*=/g) || []).map((x) => x.replace(/\s*=$/, '')));
    const f = (FIELDS[ctx.type] || '').split(' ').filter((x) => x && !used.has(x));
    items = f.map((x) => ({ text: x, insert: x + ' = ', hint: 'поле ' + ctx.type }));
  } else {
    const after = /\b(new|draw)\s+[A-Za-z0-9]*$/.test(lineHead);
    // Сначала базовые типы (Point), потом варианты Point2D / Point3D.
    if (after) items = TYPE_WORDS.slice().sort((a, b) => (/(2D|3D)$/.test(a) - /(2D|3D)$/.test(b)) || a.localeCompare(b)).map((x) => ({ text: x, hint: 'тип' }));
    else {
      const names = namesInCode().map((x) => ({ text: x, hint: 'имя' }));
      const kws = [...PREFIX_WORDS, ...DECL_WORDS, 'true', 'false'].map((x) => ({ text: x, hint: 'слово' }));
      const fns = BUILTINS.map((x) => ({ text: x, insert: x + '(', hint: 'функция' }));
      const sn = (ctx && ctx.type) ? [] : Object.keys(SNIPPETS).map((k) => ({ text: k, insert: SNIPPETS[k], hint: 'шаблон', snippet: true }));
      const sk = ctx ? [] : SCENE_KEYS.map((k) => ({ text: k, insert: k + ' = ', hint: 'сцена' }));
      items = [...names, ...kws, ...fns, ...sn, ...sk];
    }
  }
  const lw = word.toLowerCase();
  items = items.filter((x) => x.text.toLowerCase().startsWith(lw) && x.text !== word);
  const seen = new Set(); items = items.filter((x) => !seen.has(x.text) && seen.add(x.text));
  if (!items.length) return hideSug();
  sugItems = items.slice(0, 60); sugSel = 0;
  sugRange = { start: pos - word.length, end: pos };
  renderSug();
}
function renderSug() {
  sug.innerHTML = sugItems.map((x, i) => `<div class="${i === sugSel ? 'sel' : ''}" data-i="${i}"><span>${esc(x.text)}</span><small>${esc(x.hint)}</small></div>`).join('');
  // Положение — по координатам каретки: моноширинный шрифт, считаем по строке/столбцу.
  const pos = code.selectionStart, v = code.value;
  const ln = v.slice(0, pos).split('\n').length - 1;
  const col = pos - lineStart(pos);
  const cw = charWidth();
  const lh = lineH();
  let left = 12 + col * cw - code.scrollLeft, top = 10 + (ln + 1) * lh - code.scrollTop + 2;
  const wrap = $('codeWrap').getBoundingClientRect();
  left = Math.max(4, Math.min(left, wrap.width - 230));
  if (top + 200 > wrap.height) top = Math.max(4, top - lh - 205);
  sug.style.left = left + 'px'; sug.style.top = top + 'px';
  sug.style.display = 'block';
  const el = sug.children[sugSel]; if (el) el.scrollIntoView({ block: 'nearest' });
}
let _cw = 0;
function charWidth() {
  if (_cw) return _cw;
  const s = document.createElement('span');
  s.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:inherit';
  s.textContent = 'x'.repeat(100);
  hl.appendChild(s); _cw = s.getBoundingClientRect().width / 100; s.remove();
  return _cw || 7.8;
}
function acceptSug() {
  const it = sugItems[sugSel]; if (!it) return;
  let text = it.insert || it.text;
  if (it.snippet) {
    const ls = lineStart(sugRange.start);
    const ind = (code.value.slice(ls, sugRange.start).match(/^[ \t]*/) || [''])[0];
    text = text.replace(/\n/g, '\n' + ind);
    const caret = text.indexOf('\n' + ind + '  \n');
    hideSug();
    replaceRange(sugRange.start, sugRange.end, text, caret >= 0 ? sugRange.start + caret + ind.length + 3 : sugRange.start + text.length);
    return;
  }
  hideSug();
  replaceRange(sugRange.start, sugRange.end, text);
}
function handleSugKey(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); sugSel = (sugSel + 1) % sugItems.length; renderSug(); return true; }
  if (e.key === 'ArrowUp') { e.preventDefault(); sugSel = (sugSel - 1 + sugItems.length) % sugItems.length; renderSug(); return true; }
  if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); acceptSug(); return true; }
  if (e.key === 'Escape') { e.preventDefault(); hideSug(); return true; }
  return false;
}
sug.addEventListener('mousedown', (e) => {
  const d = e.target.closest('[data-i]'); if (!d) return;
  e.preventDefault(); sugSel = +d.dataset.i; acceptSug();
});
code.addEventListener('blur', () => setTimeout(hideSug, 120));
code.addEventListener('click', hideSug);

/* ==========================================================================
   Файлы, ссылки, шаблоны, примеры
   ========================================================================== */
let fileName = store.get(LS_NAME) || 'scene.gms';
function setFileName(n) { fileName = n; $('fileName').textContent = n; store.set(LS_NAME, n); }
function setCode(src, name) {
  hideSug();
  code.value = src;
  if (name) setFileName(name);
  code.scrollTop = 0;
  store.set(LS_CODE, src);
  renderEditor();
  run(true);
}
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('bSave').onclick = () => download(fileName.endsWith('.gms') ? fileName : fileName + '.gms', code.value, 'text/plain;charset=utf-8');
$('bHtml').onclick = () => {
  const r = compileScene(code.value);
  if (!r.success) { run(); toast('Сначала исправьте ошибки компиляции'); return; }
  download(fileName.replace(/\.gms$/, '') + '.html', r.html, 'text/html;charset=utf-8');
};
$('bOpen').onclick = () => $('fileIn').click();
$('fileIn').onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  setCode(await f.text(), f.name);
  e.target.value = '';
};

const b64u = {
  enc(bytes) { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  dec(str) { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, (c) => c.charCodeAt(0)); },
};
async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}
async function packCode(src) {
  const raw = new TextEncoder().encode(src);
  if (typeof CompressionStream === 'function') return 'z' + b64u.enc(await pipe(raw, new CompressionStream('deflate-raw')));
  return 'p' + b64u.enc(raw);
}
async function unpackCode(s) {
  const bytes = b64u.dec(s.slice(1));
  const raw = s[0] === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes;
  return new TextDecoder().decode(raw);
}
$('bShare').onclick = async () => {
  const url = location.origin + location.pathname + '#code=' + await packCode(code.value);
  history.replaceState(null, '', url);
  try { await navigator.clipboard.writeText(url); toast('Ссылка с кодом скопирована'); }
  catch (e) { toast('Ссылка — в адресной строке'); }
};

// Меню шаблонов (вместо системного <select>: подписи-пояснения и клавиатура).
const TEMPLATE_NOTES = {
  'Пустая 2D-сцена': 'Поле с осями и одной точкой',
  'Треугольник и углы': 'Точки, отрезки, углы и живое описание',
  'График с ползунками': 'func, draw Function и два ползунка',
  'Вкладки': 'Кластеры и кнопки-переключатели',
  '3D-сцена': 'Тетраэдр из точек и рёбер',
  'Анимация': 'animate и точка на окружности',
  'Граф': 'Граф, собираемый в Update',
};
const tplMenu = $('tplMenu'), bTpl = $('bTemplates');
tplMenu.innerHTML = Object.keys(TEMPLATES).map((k) => `<button type="button" role="menuitem" data-tpl="${esc(k)}">${esc(k)}<small>${esc(TEMPLATE_NOTES[k] || '')}</small></button>`).join('');
function setTplMenu(open) {
  tplMenu.hidden = !open;
  bTpl.setAttribute('aria-expanded', open);
  if (open) { const f = tplMenu.querySelector('button'); if (f) f.focus(); }
}
bTpl.onclick = (e) => { e.stopPropagation(); setTplMenu(tplMenu.hidden); };
document.addEventListener('click', (e) => { if (!tplMenu.hidden && !tplMenu.contains(e.target)) setTplMenu(false); });
tplMenu.addEventListener('keydown', (e) => {
  const items = [...tplMenu.querySelectorAll('button')], i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); }
  if (e.key === 'Escape') { setTplMenu(false); bTpl.focus(); }
});
tplMenu.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tpl]'); if (!b) return;
  const k = b.dataset.tpl;
  setTplMenu(false);
  if (code.value.trim() && !confirm('Заменить текущий код шаблоном «' + k + '»? Несохранённые изменения пропадут.')) return;
  setCode(TEMPLATES[k], 'scene.gms');
  store.set(LS_CODE + '-pristine', TEMPLATES[k]);
});

// ---- примеры справочника (data/examples/*.gms, список — data/gms-docs/examples-index.json)
let examples = null, exSel = 0, exShown = [];
async function openExamples() {
  $('dlg').classList.add('show');
  $('exSearch').focus();
  if (!examples) {
    $('exList').innerHTML = '<p style="padding:1rem;color:var(--text-tertiary)">Загрузка…</p>';
    try {
      examples = await (await fetch('/data/gms-docs/examples-index.json')).json();
      const secs = [...new Set(examples.map((x) => x[2]).filter(Boolean))];
      for (const s of secs) { const o = document.createElement('option'); o.value = s; o.textContent = s; $('exSection').appendChild(o); }
    } catch (e) { $('exList').innerHTML = '<p style="padding:1rem">Не удалось загрузить список примеров</p>'; return; }
  }
  renderExamples();
}
function renderExamples() {
  const q = $('exSearch').value.trim().toLowerCase(), sec = $('exSection').value;
  exShown = examples.filter((x) => (!sec || x[2] === sec) && (!q || x[1].toLowerCase().includes(q) || x[0].includes(q))).slice(0, 300);
  exSel = 0;
  $('exList').innerHTML = exShown.length
    ? exShown.map((x, i) => `<button type="button" data-i="${i}" class="${i === 0 ? 'sel' : ''}"><span>${esc(x[1])}</span><small>${esc(x[2] || '')}</small></button>`).join('')
    : '<p style="padding:1rem;color:var(--text-tertiary)">Ничего не найдено</p>';
}
async function loadExample(x) {
  closeExamples();
  if (code.value.trim() && code.value !== store.get(LS_CODE + '-pristine') && !confirm('Открыть пример «' + x[1] + '»? Текущий код будет заменён.')) return;
  try {
    const r = await fetch('/data/examples/' + encodeURIComponent(x[0]) + '.gms');
    if (!r.ok) throw new Error(r.status);
    const src = await r.text();
    setCode(src, x[0] + '.gms');
    store.set(LS_CODE + '-pristine', src);
  } catch (e) { toast('Не удалось загрузить пример'); }
}
function closeExamples() { $('dlg').classList.remove('show'); }
$('bExamples').onclick = openExamples;
$('exClose').onclick = closeExamples;
$('dlg').addEventListener('click', (e) => { if (e.target === $('dlg')) closeExamples(); });
$('exSearch').addEventListener('input', renderExamples);
$('exSection').addEventListener('change', renderExamples);
$('exList').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) loadExample(exShown[+b.dataset.i]); });
$('exSearch').addEventListener('keydown', (e) => {
  const btns = $('exList').querySelectorAll('button');
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!btns.length) return;
    btns[exSel] && btns[exSel].classList.remove('sel');
    exSel = (exSel + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length;
    btns[exSel].classList.add('sel'); btns[exSel].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter' && exShown[exSel]) { e.preventDefault(); loadExample(exShown[exSel]); }
  else if (e.key === 'Escape') closeExamples();
});

$('bFull').onclick = () => {
  const on = $('ws').classList.toggle('fs');
  $('bFull').classList.toggle('on', on);
  if (on) toast('Esc — выйти из полноэкранного режима');
};
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('ws').classList.contains('fs') && !sugVisible() && !document.querySelector('.dlg.show') && $('findBar').hidden) { $('ws').classList.remove('fs'); $('bFull').classList.remove('on'); }
});

let toastTimer = null;
function toast(t) {
  const el = $('toast'); el.textContent = t; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ==========================================================================
   Поиск и замена (Ctrl+F, Ctrl+H)
   ========================================================================== */
const findBar = $('findBar'), fFind = $('fFind'), fRepl = $('fRepl');
let fHits = [], fIdx = -1;
function openFind(replace) {
  findBar.hidden = false;
  const sel = code.value.slice(code.selectionStart, code.selectionEnd);
  if (sel && !sel.includes('\n')) fFind.value = sel;
  (replace && fFind.value ? fRepl : fFind).focus();
  fFind.select && !replace && fFind.select();
  findAll(true);
}
function closeFind() { findBar.hidden = true; fHits = []; paintHits(); code.focus(); }
function findAll(keepPos) {
  const q = fFind.value, v = code.value;
  fHits = [];
  if (q) {
    const hay = $('fCase').checked ? v : v.toLowerCase(), nd = $('fCase').checked ? q : q.toLowerCase();
    for (let i = hay.indexOf(nd); i >= 0 && fHits.length < 5000; i = hay.indexOf(nd, i + nd.length)) fHits.push(i);
  }
  fFind.classList.toggle('bad', !!q && !fHits.length);
  if (keepPos) { const c = code.selectionStart; fIdx = fHits.findIndex((x) => x >= c); if (fIdx < 0) fIdx = fHits.length ? 0 : -1; }
  else if (fIdx >= fHits.length) fIdx = fHits.length - 1;
  $('fCount').textContent = q ? (fHits.length ? (fIdx + 1) + ' из ' + fHits.length : 'нет') : '';
  paintHits();
}
// Слой под текстом: подсветка всех совпадений, текущее — ярче.
function paintHits() {
  const fm = $('fm');
  if (findBar.hidden || !fHits.length) { fm.innerHTML = ''; return; }
  const v = code.value, n = fFind.value.length;
  let out = '', last = 0;
  fHits.forEach((at, k) => { out += esc(v.slice(last, at)) + '<mark' + (k === fIdx ? ' class="cur"' : '') + '>' + esc(v.slice(at, at + n)) + '</mark>'; last = at + n; });
  fm.innerHTML = out + esc(v.slice(last)) + '\n';
  syncScroll();
}
function selectHit(focusCode) {
  if (fIdx < 0 || !fHits.length) return;
  const at = fHits[fIdx], len = fFind.value.length;
  code.setSelectionRange(at, at + len);
  const ln = code.value.slice(0, at).split('\n').length;
  const lh = lineH(), top = (ln - 1) * lh;
  if (top < code.scrollTop || top > code.scrollTop + code.clientHeight - 2 * lh) code.scrollTop = Math.max(0, top - code.clientHeight / 3);
  if (focusCode) code.focus();
  $('fCount').textContent = (fIdx + 1) + ' из ' + fHits.length;
  paintHits();
}
function findStep(dir) {
  findAll(false);
  if (!fHits.length) return;
  fIdx = (fIdx + dir + fHits.length) % fHits.length;
  selectHit(false);
}
function replaceOne() {
  findAll(false);
  if (!fHits.length) return;
  const s = code.selectionStart, e = code.selectionEnd, q = fFind.value;
  const cur = code.value.slice(s, e);
  const same = $('fCase').checked ? cur === q : cur.toLowerCase() === q.toLowerCase();
  if (!same) { selectHit(false); return; }   // сначала показываем, что заменим
  const r = fRepl.value;
  replaceRange(s, e, r, s + r.length);
  fFind.focus();
  findAll(false);
  fIdx = fHits.findIndex((x) => x >= s + r.length); if (fIdx < 0) fIdx = fHits.length ? 0 : -1;
  selectHit(false);
}
function replaceAll() {
  findAll(false);
  if (!fHits.length) return;
  const q = fFind.value, r = fRepl.value, n = fHits.length;
  let out = '', last = 0;
  for (const at of fHits) { out += code.value.slice(last, at) + r; last = at + q.length; }
  out += code.value.slice(last);
  replaceRange(0, code.value.length, out, 0);
  findAll(false);
  toast('Заменено: ' + n);
}
$('bFind').onclick = () => (findBar.hidden ? openFind(false) : closeFind());
fFind.addEventListener('input', () => { findAll(true); selectHit(false); });
$('fCase').onchange = () => { findAll(true); selectHit(false); };
$('fNext').onclick = () => findStep(1);
$('fPrev').onclick = () => findStep(-1);
$('fOne').onclick = replaceOne;
$('fAll').onclick = replaceAll;
$('fClose').onclick = closeFind;
findBar.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closeFind(); }
  else if (e.key === 'Enter' && e.target === fFind) { e.preventDefault(); findStep(e.shiftKey ? -1 : 1); }
  else if (e.key === 'Enter' && e.target === fRepl) { e.preventDefault(); (e.ctrlKey || e.metaKey) ? replaceAll() : replaceOne(); }
});
code.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !findBar.hidden && !sugVisible()) closeFind();
  if (e.key === 'F3') { e.preventDefault(); if (findBar.hidden) openFind(false); else findStep(e.shiftKey ? -1 : 1); }
});

/* ==========================================================================
   Мои сцены: несколько именованных сцен в браузере (localStorage)
   ========================================================================== */
const LS_SCENES = 'mf-playground-scenes';
function loadScenes() { try { const a = JSON.parse(store.get(LS_SCENES) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function saveScenes(a) {
  try { localStorage.setItem(LS_SCENES, JSON.stringify(a)); return true; }
  catch (e) { toast('Не хватает места в браузере — удалите старые сцены'); return false; }
}
const scMenu = $('scMenu'), bSc = $('bScenes');
function fmtDate(t) { try { return new Date(t).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
function renderScenes() {
  const list = loadScenes().sort((a, b) => b.t - a.t);
  scMenu.innerHTML = `<button type="button" role="menuitem" data-act="save">Сохранить текущую…<small>Под новым именем или поверх старой</small></button><hr>` +
    (list.length ? list.map((x) => `<div class="sc-row"><button type="button" role="menuitem" data-open="${esc(x.name)}"><span>${esc(x.name)}</span><small>${esc(fmtDate(x.t))} · ${x.code.split('\n').length} строк</small></button>` +
      `<button type="button" data-del="${esc(x.name)}" title="Удалить" aria-label="Удалить сцену ${esc(x.name)}">✕</button></div>`).join('')
      : '<div class="sc-empty">Здесь появятся сохранённые сцены. Они хранятся только в этом браузере.</div>');
}
function setScMenu(open) {
  if (open) renderScenes();
  scMenu.hidden = !open; bSc.setAttribute('aria-expanded', open);
  if (open) { const f = scMenu.querySelector('button'); if (f) f.focus(); }
}
function saveSceneAs() {
  const def = fileName.replace(/\.gms$/, '');
  const name = (prompt('Название сцены:', def) || '').trim();
  if (!name) return;
  const list = loadScenes(), i = list.findIndex((x) => x.name === name);
  if (i >= 0 && !confirm('Сцена «' + name + '» уже есть. Заменить?')) return;
  const item = { name, code: code.value, t: Date.now() };
  if (i >= 0) list[i] = item; else list.push(item);
  if (saveScenes(list)) { setFileName(name + '.gms'); toast('Сцена «' + name + '» сохранена'); }
}
bSc.onclick = (e) => { e.stopPropagation(); setScMenu(scMenu.hidden); };
document.addEventListener('click', (e) => { if (!scMenu.hidden && !scMenu.contains(e.target)) setScMenu(false); });
scMenu.addEventListener('keydown', (e) => {
  const items = [...scMenu.querySelectorAll('button')], i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); }
  if (e.key === 'Escape') { setScMenu(false); bSc.focus(); }
});
scMenu.addEventListener('click', (e) => {
  e.stopPropagation();
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.act === 'save') { setScMenu(false); saveSceneAs(); return; }
  if (b.dataset.del !== undefined) {
    const n = b.dataset.del;
    if (!confirm('Удалить сцену «' + n + '»?')) return;
    saveScenes(loadScenes().filter((x) => x.name !== n)); renderScenes(); return;
  }
  if (b.dataset.open !== undefined) {
    const x = loadScenes().find((y) => y.name === b.dataset.open); setScMenu(false);
    if (!x) return;
    if (code.value.trim() && code.value !== x.code && code.value !== store.get(LS_CODE + '-pristine') && !confirm('Открыть сцену «' + x.name + '»? Текущий код будет заменён.')) return;
    setCode(x.code, x.name + '.gms');
    store.set(LS_CODE + '-pristine', x.code);
  }
});

/* ==========================================================================
   Снимок сцены (.png): все холсты сцены сводятся в одну картинку
   ========================================================================== */
$('pvShot').onclick = () => {
  const root = sceneHost.shadowRoot;
  const canvases = root ? [...root.querySelectorAll('canvas')].filter((c) => c.width && c.height && c.offsetParent !== null) : [];
  if (!canvases.length) { toast('Сначала запустите сцену'); return; }
  // Снимаем в кадре анимации: у WebGL-холста буфер ещё не очищен.
  requestAnimationFrame(() => {
    const hr = sceneHost.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const out = document.createElement('canvas');
    out.width = Math.round(hr.width * dpr); out.height = Math.round(hr.height * dpr);
    const g = out.getContext('2d');
    g.fillStyle = getComputedStyle(document.body).backgroundColor || '#fff';
    g.fillRect(0, 0, out.width, out.height);
    for (const c of canvases) {
      const r = c.getBoundingClientRect();
      try { g.drawImage(c, (r.left - hr.left) * dpr, (r.top - hr.top) * dpr, r.width * dpr, r.height * dpr); } catch (e) {}
    }
    out.toBlob((blob) => {
      if (!blob) { toast('Не удалось сделать снимок'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = fileName.replace(/\.gms$/, '') + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast('Снимок сохранён');
    }, 'image/png');
  });
};

/* ==========================================================================
   Разделитель панелей: ширина редактора (мышь, касание, стрелки)
   ========================================================================== */
const LS_SPLIT = 'mf-playground-split';
const ws = $('ws'), split = $('split');
function setSplit(fr, save) {
  if (fr == null) { ws.style.removeProperty('--ed-fr'); if (save) store.set(LS_SPLIT, ''); return; }
  fr = Math.max(0.35, Math.min(4, fr));
  ws.style.setProperty('--ed-fr', fr.toFixed(3) + 'fr');
  if (save) store.set(LS_SPLIT, fr.toFixed(3));
}
{ const v = parseFloat(store.get(LS_SPLIT)); if (v > 0) setSplit(v, false); }
function frFromX(x) {
  const r = ws.getBoundingClientRect(), w = r.width - split.offsetWidth;
  const left = Math.max(200, Math.min(w - 200, x - r.left - split.offsetWidth / 2));
  return left / (w - left);   // правая колонка — 1fr
}
split.addEventListener('pointerdown', (e) => {
  e.preventDefault(); split.setPointerCapture(e.pointerId);
  split.classList.add('drag'); document.body.classList.add('pg-resizing');
  const move = (ev) => setSplit(frFromX(ev.clientX), false);
  const up = (ev) => {
    split.removeEventListener('pointermove', move); split.removeEventListener('pointerup', up); split.removeEventListener('pointercancel', up);
    split.classList.remove('drag'); document.body.classList.remove('pg-resizing');
    setSplit(frFromX(ev.clientX), true);
  };
  split.addEventListener('pointermove', move); split.addEventListener('pointerup', up); split.addEventListener('pointercancel', up);
});
split.addEventListener('dblclick', () => setSplit(null, true));
split.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  e.preventDefault();
  const cur = parseFloat(ws.style.getPropertyValue('--ed-fr')) || 1.4;
  setSplit(cur * (e.key === 'ArrowLeft' ? 0.92 : 1.08), true);
});

/* ==========================================================================
   Окно «Горячие клавиши» (кнопка с клавиатурой или F1)
   ========================================================================== */
const KEYS = [
  ['Запуск и файлы', [['Запустить сцену', 'Ctrl+Enter'], ['Сохранить в браузере', 'Ctrl+S'], ['Справка по клавишам', 'F1']]],
  ['Правка', [['Подсказки (автодополнение)', 'Ctrl+Space'], ['Принять подсказку', 'Enter / Tab'], ['Отступ / убрать отступ', 'Tab / Shift+Tab'],
    ['Закомментировать строки', 'Ctrl+/'], ['Дублировать строку', 'Ctrl+D'], ['Переместить строку', 'Alt+↑ / Alt+↓'], ['Отменить / повторить', 'Ctrl+Z / Ctrl+Y']]],
  ['Поиск и навигация', [['Найти', 'Ctrl+F'], ['Заменить', 'Ctrl+H'], ['Следующее / предыдущее', 'Enter / Shift+Enter, F3'], ['Перейти к строке', 'Ctrl+G'], ['Перейти к ошибке', 'щелчок по ошибке']]],
  ['Вид', [['Крупнее / мельче шрифт', 'Ctrl + / Ctrl −'], ['Обычный шрифт', 'Ctrl+0'], ['Ширина редактора', 'потянуть разделитель'], ['Выйти из полноэкранного режима', 'Esc']]],
];
$('keysList').innerHTML = KEYS.map(([h, rows]) => '<h4>' + esc(h) + '</h4>' + rows.map(([a, k]) =>
  '<div><span>' + esc(a) + '</span><span>' + k.split(' / ').map((x) => '<kbd>' + esc(x) + '</kbd>').join(' / ') + '</span></div>').join('')).join('');
function openKeys() { $('keysDlg').classList.add('show'); $('keysClose').focus(); }
function closeKeys() { $('keysDlg').classList.remove('show'); }
$('bKeys').onclick = openKeys;
$('keysClose').onclick = closeKeys;
$('keysDlg').addEventListener('click', (e) => { if (e.target === $('keysDlg')) closeKeys(); });
$('keysDlg').addEventListener('keydown', (e) => { if (e.key === 'Escape') closeKeys(); });

/* ==========================================================================
   Документация: Markdown → HTML, оглавление, поиск
   ========================================================================== */
const view = { editor: $('viewEditor'), builder: $('viewBuilder'), docs: $('viewDocs') };
const TAB_IDS = { editor: 'tabEditor', builder: 'tabBuilder', docs: 'tabDocs' };
// Подложка активной вкладки скользит под нужную кнопку (как индикатор раздела в шапке).
function movePill() {
  const pill = $('pgPill'), on = document.querySelector('#pgTabs button.on');
  if (!pill || !on) return;
  pill.style.width = on.offsetWidth + 'px';
  pill.style.transform = 'translateX(' + (on.offsetLeft) + 'px)';
}
window.addEventListener('resize', movePill);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);
function showView(name, push) {
  for (const k of Object.keys(view)) {
    const on = k === name;
    view[k].hidden = !on;
    $(TAB_IDS[k]).classList.toggle('on', on);
    $(TAB_IDS[k]).setAttribute('aria-selected', on);
  }
  movePill();
  if (name === 'docs') loadDocs();
  if (name !== 'editor' && !findBar.hidden) { findBar.hidden = true; fHits = []; paintHits(); }
  if (name === 'builder' && window.mfBuilder) window.mfBuilder.show();
  if (push) history.replaceState(null, '', location.pathname + location.search + (name === 'editor' ? '' : '#' + name));
}
$('tabEditor').onclick = () => showView('editor', true);
$('tabBuilder').onclick = () => showView('builder', true);
$('tabDocs').onclick = () => showView('docs', true);

// Конструктор (assets/js/playground-builder.js) передаёт готовый код в редактор через этот объект.
window.mfPlayground = {
  openCode(src, name) {
    if (code.value.trim() && code.value !== src && code.value !== store.get(LS_CODE + '-pristine') &&
        !confirm('Заменить код в редакторе кодом из конструктора?')) return false;
    showView('editor', true);
    setCode(src, name || 'constructor.gms');
    store.set(LS_CODE + '-pristine', src);
    return true;
  },
  compile, highlight, toast,
  get scene() { return scene; },   // текущая встроенная сцена (для отладки и тестов)
};

function inline(s) {
  // экранирование + `код`, **жирный**, *курсив*, [ссылка](адрес) — адрес #якорь, /путь или https://
  const parts = s.split(/(`[^`]+`)/g);
  return parts.map((p) => {
    if (/^`[^`]+`$/.test(p)) return '<code>' + esc(p.slice(1, -1)) + '</code>';
    return esc(p)
      .replace(/\[([^\]]+)\]\((#[\w\u0400-\u04FF-]+|\/[^\s)]*|https?:\/\/[^\s)]+)\)/g, (m, t, u) =>
        '<a href="' + u.replace(/"/g, '%22') + '"' + (u[0] === '#' ? ' data-anchor="' + u.slice(1) + '"' : (/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '')) + '>' + t + '</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
  }).join('');
}
function slug(t, used) {
  let s = t.toLowerCase().replace(/`/g, '').replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '') || 'r';
  let k = s, n = 2; while (used.has(k)) k = s + '-' + n++;
  used.add(k); return k;
}
function splitRow(l) {
  // Разбиение строки таблицы по «|», кроме экранированных «\|» и внутри `кода`.
  const cells = []; let cur = '', inCode = false;
  for (let i = 0; i < l.length; i++) {
    const ch = l[i];
    if (ch === '\\' && l[i + 1] === '|') { cur += '|'; i++; continue; }
    if (ch === '`') inCode = !inCode;
    if (ch === '|' && !inCode) { cells.push(cur); cur = ''; continue; }
    cur += ch;
  }
  cells.push(cur);
  return cells.slice(1, -1).map((c) => c.trim());
}
function renderMarkdown(md) {
  const lines = md.split('\n');
  const out = [], toc = [], used = new Set();
  let i = 0, codeId = 0;
  const codes = [];
  while (i < lines.length) {
    const l = lines[i];
    const fence = l.match(/^```(\S*)/);
    if (fence) {
      const lang = fence[1]; const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      const src = buf.join('\n');
      const id = codeId++; codes[id] = src;
      const runnable = lang === 'gms';
      out.push(`<div class="cb"><pre>${lang.startsWith('gms') ? highlight(src) : esc(src)}</pre><div class="cb-bar">` +
        `<button class="mini" data-copy="${id}">Копировать</button>` +
        (runnable ? `<button class="mini on" data-open="${id}">Открыть в редакторе</button>` : '') + '</div></div>');
      continue;
    }
    const h = l.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length, text = h[2];
      const id = slug(text, used);
      if (lvl > 1) toc.push({ lvl, text, id });
      out.push(`<h${lvl} id="${id}">${inline(text)}</h${lvl}>`);
      i++; continue;
    }
    if (/^\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const head = splitRow(rows[0]);
      const body = rows.slice(2).map(splitRow);
      out.push('<div class="tw"><table><thead><tr>' + head.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>' +
        body.map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>');
      continue;
    }
    if (/^>\s?/.test(l)) {
      // Врезка: «> текст». Первая строка «> **Внимание:** …» делает её предупреждением.
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      const paras = buf.join('\n').split(/\n\s*\n/).map((x) => '<p>' + inline(x.replace(/\n/g, ' ')) + '</p>').join('');
      const warn = /^\*\*(Внимание|Важно|Осторожно)/.test(buf[0] || '');
      out.push('<blockquote' + (warn ? ' class="warn"' : '') + '>' + paras + '</blockquote>');
      continue;
    }
    if (/^\s*(-|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const items = [];
      while (i < lines.length && (/^\s*(-|\d+\.)\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^\s*(-|\d+\.)\s+/.test(lines[i])) items.push(lines[i].replace(/^\s*(-|\d+\.)\s+/, ''));
        else items[items.length - 1] += ' ' + lines[i].trim();
        i++;
      }
      out.push((ordered ? '<ol>' : '<ul>') + items.map((x) => '<li>' + inline(x) + '</li>').join('') + (ordered ? '</ol>' : '</ul>'));
      continue;
    }
    if (!l.trim()) { i++; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#|\||>|\s*(-|\d+\.)\s)/.test(lines[i])) para.push(lines[i++]);
    out.push('<p>' + inline(para.join(' ')) + '</p>');
  }
  return { html: out.join('\n'), toc, codes };
}

// Два документа: учебник (по шагам, для начинающих) и полный справочник языка.
const DOCS = { tut: '/data/gms-docs/tutorial.md', ref: '/data/gms-docs/reference.md' };
const LS_DOC = 'mf-playground-doc';
const docCache = {};
let docKind = null, docCodes = [], docHtml = '', docLoading = null;
async function fetchDoc(kind) {
  if (!docCache[kind]) {
    const r = await fetch(DOCS[kind]);
    if (!r.ok) throw new Error(r.status);
    docCache[kind] = renderMarkdown(await r.text());
  }
  return docCache[kind];
}
// Ищем якорь из адреса в обоих документах и открываем тот, где он есть.
async function loadDocs(kind) {
  const target = decodeURIComponent(location.hash.slice(1));
  if (!kind) {
    if (target && target !== 'docs') {
      for (const k of ['tut', 'ref']) { try { const d = await fetchDoc(k); if (d.html.includes('id="' + target + '"')) { kind = k; break; } } catch (e) {} }
    }
    kind = kind || docKind || (store.get(LS_DOC) === 'ref' ? 'ref' : 'tut');
  }
  if (kind === docKind && $('doc').childElementCount && !docLoading) return;
  docKind = kind; store.set(LS_DOC, kind);
  for (const [k, id] of [['tut', 'dTut'], ['ref', 'dRef']]) { $(id).classList.toggle('on', k === kind); $(id).setAttribute('aria-selected', String(k === kind)); }
  $('docSearch').value = '';
  const seq = docLoading = Symbol();
  try {
    const r = await fetchDoc(kind);
    if (docLoading !== seq) return;
    docCodes = r.codes; docHtml = r.html;
    $('doc').innerHTML = r.html;
    $('tocNav').innerHTML = r.toc.map((t) => `<a href="#${t.id}" class="l${t.lvl}" data-id="${t.id}">${inline(t.text)}</a>`).join('');
    trackToc();
    if (target && target !== 'docs' && document.getElementById(target)) document.getElementById(target).scrollIntoView();
  } catch (e) {
    $('doc').innerHTML = '<p class="nores">Не удалось загрузить документацию. Проверьте подключение и откройте вкладку ещё раз.</p>';
    $('tocNav').innerHTML = '';
  } finally { if (docLoading === seq) docLoading = null; }
}
$('dTut').onclick = () => { history.replaceState(null, '', '#docs'); loadDocs('tut').then(() => window.scrollTo({ top: 0 })); };
$('dRef').onclick = () => { history.replaceState(null, '', '#docs'); loadDocs('ref').then(() => window.scrollTo({ top: 0 })); };
$('tocToggle').onclick = () => { const o = $('tocNav').classList.toggle('open'); $('tocToggle').setAttribute('aria-expanded', String(o)); };
$('tocNav').addEventListener('click', (e) => {
  const a = e.target.closest('a'); if (!a) return;
  e.preventDefault();
  const el = document.getElementById(a.dataset.id);
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', '#' + a.dataset.id); }
  $('tocNav').classList.remove('open'); $('tocToggle').setAttribute('aria-expanded', 'false');
});
$('doc').addEventListener('click', async (e) => {
  const o = e.target.closest('[data-open]'), c = e.target.closest('[data-copy]'), an = e.target.closest('a[data-anchor]');
  if (an) {
    // Ссылка на раздел: ищем его в текущем документе, иначе — в другом.
    e.preventDefault();
    const id = an.dataset.anchor;
    if (!document.getElementById(id)) {
      const other = docKind === 'tut' ? 'ref' : 'tut';
      try { const d = await fetchDoc(other); if (d.html.includes('id="' + id + '"')) await loadDocs(other); } catch (err) {}
    }
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', '#' + id); }
    return;
  }
  if (o) {
    const src = docCodes[+o.dataset.open];
    if (code.value.trim() && code.value !== src && code.value !== store.get(LS_CODE + '-pristine') &&
        !confirm('Заменить код в редакторе примером из документации?')) return;
    showView('editor', true);
    setCode(src, 'docs-example.gms');
    store.set(LS_CODE + '-pristine', src);
  } else if (c) {
    try { await navigator.clipboard.writeText(docCodes[+c.dataset.copy]); toast('Скопировано'); } catch (err) { toast('Не удалось скопировать'); }
  }
});
let tocIO = null;
function trackToc() {
  if (tocIO) tocIO.disconnect();
  const heads = [...$('doc').querySelectorAll('h2, h3')];
  const links = new Map([...$('tocNav').querySelectorAll('a')].map((a) => [a.dataset.id, a]));
  const io = tocIO = new IntersectionObserver((ents) => {
    for (const en of ents) if (en.isIntersecting) {
      links.forEach((a) => a.classList.remove('on'));
      const a = links.get(en.target.id); if (a) a.classList.add('on');
    }
  }, { rootMargin: '-80px 0px -70% 0px' });
  heads.forEach((h) => io.observe(h));
}
// Поиск: оставляем только разделы (h2…следующий h2), где есть все слова запроса.
let searchTimer = null;
$('docSearch').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(searchDocs, 150); });
function searchDocs() {
  const q = $('docSearch').value.trim().toLowerCase();
  const doc = $('doc');
  doc.innerHTML = docHtml;
  if (!q) { trackToc(); $('tocNav').querySelectorAll('a').forEach((a) => (a.style.display = '')); return; }
  const words = q.split(/\s+/);
  const kids = [...doc.children];
  const sections = []; let cur = null;
  for (const el of kids) {
    if (el.tagName === 'H2' || el.tagName === 'H1') { cur = [el]; sections.push(cur); }
    else if (cur) cur.push(el); else { cur = [el]; sections.push(cur); }
  }
  let found = 0;
  const visibleIds = new Set();
  for (const sec of sections) {
    const text = sec.map((e) => e.textContent).join(' ').toLowerCase();
    const ok = words.every((w) => text.includes(w));
    sec.forEach((e) => (e.style.display = ok ? '' : 'none'));
    if (ok) { found++; sec.forEach((e) => { if (e.id) visibleIds.add(e.id); e.querySelectorAll && e.querySelectorAll('[id]').forEach((x) => visibleIds.add(x.id)); }); markWords(sec, words); }
  }
  $('tocNav').querySelectorAll('a').forEach((a) => (a.style.display = visibleIds.has(a.dataset.id) ? '' : 'none'));
  if (!found) doc.insertAdjacentHTML('beforeend', '<p class="nores">Ничего не найдено</p>');
}
function markWords(els, words) {
  const re = new RegExp('(' + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  for (const root of els) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      if (!re.test(n.nodeValue) || n.parentElement.closest('pre')) continue;
      re.lastIndex = 0;
      const span = document.createElement('span');
      span.innerHTML = esc(n.nodeValue).replace(re, '<mark>$1</mark>');
      n.replaceWith(...span.childNodes);
    }
  }
}

/* ==========================================================================
   Старт
   ========================================================================== */
refreshAuto();
if (fontPx !== 13) setFont(fontPx);
movePill();
setFileName(fileName);
(async function boot() {
  const h = location.hash;
  if (h.startsWith('#code=')) {
    try {
      code.value = await unpackCode(h.slice(6));
      setFileName('shared.gms');
      history.replaceState(null, '', location.pathname);
      toast('Код загружен из ссылки');
    } catch (e) { toast('Ссылка повреждена'); code.value = store.get(LS_CODE) || TEMPLATES['Треугольник и углы']; }
  } else {
    code.value = store.get(LS_CODE) || TEMPLATES['Треугольник и углы'];
  }
  renderEditor();
  run(true);
  if (h === '#builder') showView('builder', false);
  else if (h === '#docs' || (h.length > 1 && !h.startsWith('#code='))) showView('docs', false);
})();
