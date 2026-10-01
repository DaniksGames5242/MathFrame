// assets/js/playground-builder.js
// Визуальный конструктор песочницы (/playground/#builder): сцена собирается мышью —
// точки, отрезки, прямые, векторы, окружности, многоугольники, углы, середины,
// графики функций, ползунки и подписи, — а GMS-код по ней пишется автоматически и
// открывается в редакторе одной кнопкой. Модель хранится в localStorage; объекты
// ссылаются друг на друга по внутренним id, поэтому переименование ничего не ломает.

const PG = window.mfPlayground;
const $ = (id) => document.getElementById(id);
const svg = $('bdSvg'), stage = $('bdStage');
const NS = 'http://www.w3.org/2000/svg';
const LS_STATE = 'mf-builder-state';
const COLORS = ['', '#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#a855f7', '#14b8a6'];
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
// Слова языка и встроенные имена, которые нельзя занимать именами объектов.
const RESERVED = new Set(['new','draw','func','Void','Function','Start','Update','if','else','repeat','while','for','in','wait','return','set',
  'int','float','string','bool','Vector2','color','list','true','false','pi','PI','tau','E','i','x','y','t','info','mouseX','mouseY',
  'sin','cos','tan','sqrt','abs','log','exp','min','max','pow','round','floor','ceil','format']);

const KIND = {
  point:    { title: 'Точка', glyph: '•' },
  midpoint: { title: 'Середина', glyph: '◦' },
  segment:  { title: 'Отрезок', glyph: '—' },
  line:     { title: 'Прямая', glyph: '↔' },
  vector:   { title: 'Вектор', glyph: '→' },
  circle:   { title: 'Окружность', glyph: '○' },
  polygon:  { title: 'Многоугольник', glyph: '▱' },
  angle:    { title: 'Угол', glyph: '∠' },
  func:     { title: 'График', glyph: 'ƒ' },
  slider:   { title: 'Ползунок', glyph: '⊸' },
  text:     { title: 'Подпись', glyph: 'T' },
};
// need — сколько точек кликнуть; hint — подсказка в шапке поля.
const TOOLS = [
  { id: 'select', label: 'Выбор', hint: 'Перетаскивайте точки и фигуры, щелчок — выбрать объект' },
  { id: 'point', label: 'Точка', hint: 'Щёлкните по полю, чтобы поставить точку' },
  { id: 'segment', label: 'Отрезок', need: 2, hint: 'Щёлкните два конца отрезка' },
  { id: 'line', label: 'Прямая', need: 2, hint: 'Щёлкните две точки прямой' },
  { id: 'vector', label: 'Вектор', need: 2, hint: 'Щёлкните начало и конец вектора' },
  { id: 'circle', label: 'Окружность', need: 2, hint: 'Щёлкните центр, затем точку на окружности' },
  { id: 'polygon', label: 'Многоугольник', hint: 'Щёлкайте вершины; замкните щелчком по первой (или Enter)' },
  { id: 'angle', label: 'Угол', need: 3, hint: 'Щёлкните точку на первой стороне, вершину, точку на второй стороне' },
  { id: 'midpoint', label: 'Середина', need: 2, hint: 'Щёлкните две точки — появится середина отрезка между ними' },
  { id: 'text', label: 'Подпись', hint: 'Щёлкните, где разместить текст' },
];

let state = load() || freshState();
let tool = 'select', pending = [], selected = null, cursor = null;
let undoStack = [], redoStack = [];
let view = { s: 40, cx: 0, cy: 0 }; // пикселей на единицу и центр поля в пикселях

function freshState() {
  return { settings: { width: 20, height: 12, axes: true, grid: true, snap: true, description: '' }, objs: [], seq: 1 };
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(LS_STATE)); return s && Array.isArray(s.objs) ? s : null; } catch (e) { return null; }
}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveTimer = null; try { localStorage.setItem(LS_STATE, JSON.stringify(state)); } catch (e) {} }, 250);
}
// Отложенная запись не должна теряться при закрытии/перезагрузке вкладки.
window.addEventListener('pagehide', () => { if (saveTimer) { clearTimeout(saveTimer); try { localStorage.setItem(LS_STATE, JSON.stringify(state)); } catch (e) {} } });
function snapshot() {
  undoStack.push(JSON.stringify(state));
  if (undoStack.length > 200) undoStack.shift();
  redoStack = [];
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(state));
  state = JSON.parse(undoStack.pop());
  if (selected && !byId(selected)) selected = null;
  pending = [];
  refresh(true);
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(state));
  state = JSON.parse(redoStack.pop());
  if (selected && !byId(selected)) selected = null;
  refresh(true);
}

/* ==========================================================================
   Модель
   ========================================================================== */
const byId = (id) => state.objs.find((o) => o.id === id);
const isPointKind = (o) => o && (o.kind === 'point' || o.kind === 'midpoint');
function refsOf(o) {
  switch (o.kind) {
    case 'midpoint': case 'segment': case 'line': case 'vector': return [o.a, o.b];
    case 'circle': return [o.c, o.p];
    case 'polygon': return o.pts;
    case 'angle': return [o.a, o.o, o.b];
    default: return [];
  }
}
// Все имена, которые объект занимает в коде (вспомогательные отрезки и т. п.).
function namesOf(o) {
  const n = o.name;
  switch (o.kind) {
    case 'line': return [n, n + '_inf'];
    case 'vector': return [n, n + '_v'];
    case 'polygon': return [n, n + '_fill', ...o.pts.map((_, i) => n + '_' + (i + 1))];
    case 'angle': return [n, n + '_d', n + '_r1', n + '_r2'];
    case 'func': return [n, n + '_gr'];
    case 'slider': return [n, n + '_ui'];
    default: return [n];
  }
}
function takenNames(exceptId) {
  const s = new Set();
  for (const o of state.objs) if (o.id !== exceptId) namesOf(o).forEach((x) => s.add(x));
  return s;
}
function nameOk(name, o) {
  if (!IDENT.test(name) || RESERVED.has(name)) return false;
  const taken = takenNames(o.id);
  return namesOf({ ...o, name }).every((x) => !taken.has(x));
}
function autoName(kind, extra) {
  const taken = takenNames(null);
  const free = (n) => !RESERVED.has(n) && namesOf({ kind, name: n, pts: extra && extra.pts || [] }).every((x) => !taken.has(x));
  if (kind === 'point' || kind === 'midpoint') {
    for (const base of ['', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
      for (const L of 'ABCDEFGHKLMNOPQRSTUVWXYZ') if (free(L + base)) return L + base;
  }
  if (extra && extra.from) { const n = extra.from; if (IDENT.test(n) && free(n)) return n; }
  const prefix = { segment: 's', line: 'l', vector: 'v', circle: 'w', polygon: 'F', angle: 'ang', func: 'f', slider: 'a', text: 'txt' }[kind] || 'o';
  if (kind === 'slider') for (const L of 'abcdkmnpqruv') if (free(L)) return L;
  if (kind === 'func') for (const L of ['f', 'g', 'h', 'p', 'q']) if (free(L)) return L;
  for (let i = 1; ; i++) if (free(prefix + i)) return prefix + i;
}
function add(o) {
  o.id = 'o' + (state.seq++);
  o.color = o.color || '';
  state.objs.push(o);
  return o;
}
function remove(id) {
  // Каскадно: всё, что ссылается на удаляемый объект, тоже удаляется.
  const dead = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const o of state.objs) if (!dead.has(o.id) && refsOf(o).some((r) => dead.has(r))) { dead.add(o.id); grew = true; }
  }
  state.objs = state.objs.filter((o) => !dead.has(o.id));
  if (dead.has(selected)) selected = null;
}
function pos(id) {
  const o = byId(id);
  if (!o) return { x: 0, y: 0 };
  if (o.kind === 'point') return { x: o.x, y: o.y };
  if (o.kind === 'midpoint') { const a = pos(o.a), b = pos(o.b); return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  return { x: 0, y: 0 };
}
const sliderVals = () => Object.fromEntries(state.objs.filter((o) => o.kind === 'slider').map((o) => [o.name, +o.value]));

/* ---- выражения функций: GMS → JS только для предпросмотра на поле ---- */
const MATH = { sin: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan', asin: 'Math.asin', acos: 'Math.acos', atan: 'Math.atan',
  sqrt: 'Math.sqrt', abs: 'Math.abs', exp: 'Math.exp', log: 'Math.log', log2: 'Math.log2', log10: 'Math.log10',
  floor: 'Math.floor', ceil: 'Math.ceil', round: 'Math.round', sign: 'Math.sign', min: 'Math.min', max: 'Math.max', pow: 'Math.pow',
  sinh: 'Math.sinh', cosh: 'Math.cosh', tanh: 'Math.tanh', cbrt: 'Math.cbrt', pi: 'Math.PI', PI: 'Math.PI', E: 'Math.E', tau: '(2*Math.PI)' };
const fnCache = new Map();
function compileExpr(expr, vars) {
  const key = expr + '|' + vars.join(',');
  if (fnCache.has(key)) return fnCache.get(key);
  let fn = null;
  try {
    if (!/^[\w\s+\-*/^().,%<>=!?:&|]*$/.test(expr)) throw 0;
    const js = expr.replace(/\^/g, '**').replace(/[A-Za-z_][A-Za-z0-9_]*/g, (w) => {
      if (w === 'x' || vars.includes(w)) return w;
      if (MATH[w]) return MATH[w];
      throw 0;
    });
    fn = new Function('x', ...vars, '"use strict"; return (' + js + ');');
    fn(0.5, ...vars.map(() => 1));
  } catch (e) { fn = null; }
  fnCache.set(key, fn);
  return fn;
}

/* ==========================================================================
   Генерация GMS-кода
   ========================================================================== */
const num = (v) => { const r = Math.round(v * 1000) / 1000; return Object.is(r, -0) ? '0' : String(r); };
const str = (s) => '"' + String(s).replace(/\\/g, '').replace(/"/g, '”').replace(/\n/g, '\\n') + '"';
const colorField = (o) => (o.color ? '; color = ' + o.color : '');

function generate() {
  const S = state.settings, L = [];
  const N = (id) => (byId(id) || {}).name;
  const of = (k) => state.objs.filter((o) => o.kind === k);
  const measured = state.objs.filter((o) => o.measure);
  L.push('[');
  L.push('description = ' + (measured.length ? '"{info}"' : str(S.description || 'Сцена из конструктора')));
  L.push('');
  L.push(`field width = ${num(S.width)}; field height = ${num(S.height)};`);
  L.push('camera type = fixed;');
  L.push(`show axes = ${!!S.axes}; show grid = ${!!S.grid};`);

  const section = (title, lines) => { if (lines.length) { L.push('', '// ---- ' + title + ' ----', ...lines); } };
  section('Параметры', of('slider').flatMap((o) => [
    `float ${o.name} = ${num(o.value)};`,
    `new UI { name = "${o.name}_ui"; type = slider; label = ${str(o.label || o.name)}; variable = ${o.name}; min = ${num(o.min)}; max = ${num(o.max)}; step = ${num(o.step)} }`,
  ]));
  section('Функции', of('func').flatMap((o) => {
    const r = [`func ${o.name}(x) = ${o.expr || '0'};`];
    let f = `draw Function { name = "${o.name}_gr"; f = "${o.name}"`;
    if (o.xmin !== '' && o.xmin != null) f += `; xmin = ${num(+o.xmin)}`;
    if (o.xmax !== '' && o.xmax != null) f += `; xmax = ${num(+o.xmax)}`;
    r.push(f + colorField(o) + ' }');
    return r;
  }));
  const ptLine = (o) => {
    const lab = o.label ? `; text = true(${str(o.caption || o.name)})` : '';
    if (o.kind === 'midpoint') return `new Point { name = "${o.name}"; homothety = ${N(o.b)}; center = ${N(o.a)}; ratio = 0.5${lab}${colorField(o)} }`;
    return `new Point { name = "${o.name}"; pos = (${num(o.x)}, ${num(o.y)})${lab}${o.fixed ? '; dynamic = false' : ''}${colorField(o)} }`;
  };
  section('Точки', state.objs.filter(isPointKind).map(ptLine));
  const lines = [];
  for (const o of state.objs) {
    if (o.kind === 'segment') lines.push(`new Line { name = "${o.name}"; pos = (${N(o.a)}, ${N(o.b)})${colorField(o)} }`);
    if (o.kind === 'line') lines.push(`new Line { name = "${o.name}"; pos = (${N(o.a)}, ${N(o.b)})${colorField(o)} }`,
      `draw InfLine { name = "${o.name}_inf"; edge = "${o.name}"${colorField(o)} }`);
    if (o.kind === 'vector') lines.push(`new Line { name = "${o.name}"; pos = (${N(o.a)}, ${N(o.b)})${colorField(o)} }`,
      `draw Vector { name = "${o.name}_v"; edge = "${o.name}"${colorField(o)} }`);
  }
  section('Отрезки, прямые, векторы', lines);
  section('Окружности', of('circle').map((o) => `new Circle { name = "${o.name}"; center = ${N(o.c)}; radius = ${N(o.p)}${colorField(o)} }`));
  section('Многоугольники', of('polygon').flatMap((o) => {
    const r = o.pts.map((p, i) => `new Line { name = "${o.name}_${i + 1}"; pos = (${N(p)}, ${N(o.pts[(i + 1) % o.pts.length])})${colorField(o)} }`);
    r.push(`new Figure { name = "${o.name}"; elements = (${o.pts.map((_, i) => o.name + '_' + (i + 1)).join(', ')}) }`);
    if (o.fill) r.push(`draw Filling { name = "${o.name}_fill"; figure = "${o.name}"; opacity = 0.25${colorField(o)} }`);
    return r;
  }));
  section('Углы', of('angle').flatMap((o) => [
    `new Line { name = "${o.name}_r1"; pos = (${N(o.o)}, ${N(o.a)}) }`,
    `new Line { name = "${o.name}_r2"; pos = (${N(o.o)}, ${N(o.b)}) }`,
    `new Angle { name = "${o.name}"; lines = (${o.name}_r1, ${o.name}_r2) }`,
    `draw Angle { name = "${o.name}_d"; angle = "${o.name}"; count = ${o.arcs || 1}${o.color ? '; arccolor = ' + o.color : ''} }`,
  ]));
  section('Подписи', of('text').map((o) => `draw Text { name = "${o.name}"; pos = (${num(o.x)}, ${num(o.y)}); text = ${str(o.text || '')}${colorField(o)} }`));

  if (measured.length) {
    const parts = measured.map((o) => {
      const n = o.name;
      switch (o.kind) {
        case 'point': case 'midpoint': return `"**${n}** (" + format(${n}.pos.x, 2) + "; " + format(${n}.pos.y, 2) + ")"`;
        case 'segment': case 'vector': return `"**${n}** = " + format(${n}.length, 2)`;
        case 'line': return `"**${n}**: наклон " + format(atan2(${N(o.b)}.pos.y - ${N(o.a)}.pos.y, ${N(o.b)}.pos.x - ${N(o.a)}.pos.x) * 180 / pi, 1) + "°"`;
        case 'circle': { const c = N(o.c), p = N(o.p); return `"**${n}**: радиус " + format(sqrt((${p}.pos.x - ${c}.pos.x)^2 + (${p}.pos.y - ${c}.pos.y)^2), 2)`; }
        case 'angle': return `"**∠${n}** = " + format(${n}.measure, 1) + "°"`;
        case 'slider': return `"**${n}** = " + format(${n}, 2)`;
        default: return null;
      }
    }).filter(Boolean);
    const head = S.description ? [str(S.description)] : [];
    L.push('', '// ---- Живое описание ----', 'string info = "";', 'Update {', '  info = ' + [...head, ...parts].join(' + "\\n\\n" + ') + ';', '}');
  }
  L.push(']');
  return L.join('\n');
}

/* ==========================================================================
   Отрисовка поля
   ========================================================================== */
function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  (parent || svg).appendChild(e);
  return e;
}
const toPx = (p) => ({ x: view.cx + p.x * view.s, y: view.cy - p.y * view.s });
const fromPx = (x, y) => ({ x: (x - view.cx) / view.s, y: (view.cy - y) / view.s });
const ink = (o) => o.color || 'var(--text-primary)';

function layout() {
  const r = stage.getBoundingClientRect();
  const W = state.settings.width, H = state.settings.height;
  view.s = Math.max(4, Math.min((r.width - 24) / W, (r.height - 24) / H));
  view.cx = r.width / 2; view.cy = r.height / 2;
  svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
}
function draw() {
  layout();
  svg.innerHTML = '';
  svg.classList.toggle('sel-mode', tool === 'select');
  const S = state.settings, hw = S.width / 2, hh = S.height / 2;
  const tl = toPx({ x: -hw, y: hh }), br = toPx({ x: hw, y: -hh });
  el('rect', { x: tl.x, y: tl.y, width: br.x - tl.x, height: br.y - tl.y, fill: 'var(--bg-card)', stroke: 'var(--border-strong)' });
  if (S.grid) {
    const g = el('g', { class: 'bd-svg-grid', 'stroke-width': 1 });
    for (let x = Math.ceil(-hw); x <= hw; x++) { const a = toPx({ x, y: hh }), b = toPx({ x, y: -hh }); el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y }, g); }
    for (let y = Math.ceil(-hh); y <= hh; y++) { const a = toPx({ x: -hw, y }), b = toPx({ x: hw, y }); el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y }, g); }
  }
  if (S.axes) {
    const g = el('g', { class: 'bd-svg-axis', 'stroke-width': 1.4 });
    const a = toPx({ x: -hw, y: 0 }), b = toPx({ x: hw, y: 0 }), c = toPx({ x: 0, y: hh }), d = toPx({ x: 0, y: -hh });
    el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y }, g); el('line', { x1: c.x, y1: c.y, x2: d.x, y2: d.y }, g);
    const step = view.s < 18 ? 5 : view.s < 30 ? 2 : 1;
    for (let x = Math.ceil(-hw / step) * step; x <= hw; x += step) if (x) { const p = toPx({ x, y: 0 }); el('text', { x: p.x, y: p.y + 12, 'text-anchor': 'middle', class: 'bd-svg-tick' }).textContent = x; }
    for (let y = Math.ceil(-hh / step) * step; y <= hh; y += step) if (y) { const p = toPx({ x: 0, y }); el('text', { x: p.x - 5, y: p.y + 3, 'text-anchor': 'end', class: 'bd-svg-tick' }).textContent = y; }
  }
  const clip = el('clipPath', { id: 'bdClip' }, el('defs', {}));
  el('rect', { x: tl.x, y: tl.y, width: br.x - tl.x, height: br.y - tl.y }, clip);
  const layer = el('g', { 'clip-path': 'url(#bdClip)' });
  const order = ['polygon', 'func', 'circle', 'line', 'segment', 'angle', 'vector', 'text', 'midpoint', 'point'];
  const sorted = state.objs.slice().sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  for (const o of sorted) drawObj(o, layer);
  // предпросмотр строящегося объекта
  if (pending.length && cursor) {
    const pts = pending.map((id) => toPx(pos(id)));
    const c = toPx(cursor);
    const d = (tool === 'polygon' ? pts : [pts[pts.length - 1]]).map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.y).join(' ') + ` L${c.x} ${c.y}`;
    el('path', { d, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, layer);
    if (tool === 'circle') { const r = Math.hypot(c.x - pts[0].x, c.y - pts[0].y); el('circle', { cx: pts[0].x, cy: pts[0].y, r, fill: 'none', stroke: 'var(--accent)', 'stroke-dasharray': '5 4' }, layer); }
    for (const p of pts) el('circle', { cx: p.x, cy: p.y, r: 9, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2 }, layer);
  }
  if (!state.objs.length && !pending.length) {
    const t = el('text', { x: view.cx, y: view.cy - 30, 'text-anchor': 'middle', fill: 'var(--text-tertiary)', 'font-size': 14 });
    t.textContent = 'Выберите инструмент сверху и щёлкните по полю';
  }
}
function drawObj(o, g) {
  const sel = o.id === selected, c = ink(o);
  const hi = (e) => { if (sel) { const h = e.cloneNode(); h.setAttribute('stroke', 'var(--accent)'); h.setAttribute('stroke-width', 8); h.setAttribute('opacity', .3); h.setAttribute('fill', 'none'); e.before(h); } return e; };
  const seg = (a, b, extra) => hi(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: c, 'stroke-width': 2.2, 'stroke-linecap': 'round', ...extra }, g));
  switch (o.kind) {
    case 'segment': seg(toPx(pos(o.a)), toPx(pos(o.b))); break;
    case 'line': {
      const a = pos(o.a), b = pos(o.b), dx = b.x - a.x, dy = b.y - a.y, k = 1000 / (Math.hypot(dx, dy) || 1);
      seg(toPx({ x: a.x - dx * k, y: a.y - dy * k }), toPx({ x: a.x + dx * k, y: a.y + dy * k }));
      break;
    }
    case 'vector': {
      const a = toPx(pos(o.a)), b = toPx(pos(o.b)), ang = Math.atan2(b.y - a.y, b.x - a.x);
      seg(a, b);
      const h = 11, w = .45;
      el('path', { d: `M${b.x} ${b.y} L${b.x - h * Math.cos(ang - w)} ${b.y - h * Math.sin(ang - w)} L${b.x - h * Math.cos(ang + w)} ${b.y - h * Math.sin(ang + w)} Z`, fill: c }, g);
      break;
    }
    case 'circle': {
      const C = toPx(pos(o.c)), P = toPx(pos(o.p));
      hi(el('circle', { cx: C.x, cy: C.y, r: Math.hypot(P.x - C.x, P.y - C.y), fill: 'none', stroke: c, 'stroke-width': 2 }, g));
      break;
    }
    case 'polygon': {
      const d = o.pts.map((id, i) => { const p = toPx(pos(id)); return (i ? 'L' : 'M') + p.x + ' ' + p.y; }).join(' ') + 'Z';
      hi(el('path', { d, fill: o.fill ? (o.color || 'var(--accent)') : 'none', 'fill-opacity': .22, stroke: c, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, g));
      break;
    }
    case 'angle': {
      const O = pos(o.o), A = pos(o.a), B = pos(o.b);
      const a1 = Math.atan2(A.y - O.y, A.x - O.x), a2 = Math.atan2(B.y - O.y, B.x - O.x);
      let d = a2 - a1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
      const P = toPx(O);
      seg(P, toPx(A), { 'stroke-width': 1.4, opacity: .7 }); seg(P, toPx(B), { 'stroke-width': 1.4, opacity: .7 });
      for (let k = 0; k < (o.arcs || 1); k++) {
        const r = 22 + k * 5, p1 = { x: P.x + r * Math.cos(a1), y: P.y - r * Math.sin(a1) }, p2 = { x: P.x + r * Math.cos(a1 + d), y: P.y - r * Math.sin(a1 + d) };
        el('path', { d: `M${p1.x} ${p1.y} A${r} ${r} 0 0 ${d > 0 ? 0 : 1} ${p2.x} ${p2.y}`, fill: 'none', stroke: o.color || 'var(--accent)', 'stroke-width': 1.8 }, g);
      }
      const deg = Math.abs(d) * 180 / Math.PI, mid = a1 + d / 2;
      el('text', { x: P.x + 42 * Math.cos(mid), y: P.y - 42 * Math.sin(mid) + 4, 'text-anchor': 'middle', class: 'bd-svg-label', 'font-size': 11 }).textContent = deg.toFixed(1) + '°';
      break;
    }
    case 'func': {
      const vals = sliderVals(), names = Object.keys(vals);
      const fn = compileExpr(o.expr || '', names);
      if (!fn) break;
      const hw = state.settings.width / 2;
      const x0 = o.xmin !== '' && o.xmin != null ? Math.max(-hw, +o.xmin) : -hw, x1 = o.xmax !== '' && o.xmax != null ? Math.min(hw, +o.xmax) : hw;
      let d = '', pen = false;
      const n = 400;
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n;
        let y; try { y = fn(x, ...names.map((k) => vals[k])); } catch (e) { y = NaN; }
        if (!isFinite(y) || Math.abs(y) > 1e4) { pen = false; continue; }
        const p = toPx({ x, y });
        d += (pen ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); pen = true;
      }
      if (d) hi(el('path', { d, fill: 'none', stroke: o.color || '#3b82f6', 'stroke-width': 2.2 }, g));
      break;
    }
    case 'text': {
      const p = toPx(o);
      const t = el('text', { x: p.x, y: p.y + 5, 'text-anchor': 'middle', class: 'bd-svg-label', fill: c, style: o.color ? 'fill:' + o.color : '' }, g);
      t.textContent = o.text || '…';
      if (sel) { const b = t.getBBox(); el('rect', { x: b.x - 4, y: b.y - 2, width: b.width + 8, height: b.height + 4, fill: 'none', stroke: 'var(--accent)', 'stroke-dasharray': '3 3' }, g); }
      break;
    }
    case 'point': case 'midpoint': {
      const p = toPx(pos(o.id));
      if (sel) el('circle', { cx: p.x, cy: p.y, r: 11, fill: 'var(--accent)', opacity: .3 }, g);
      el('circle', { cx: p.x, cy: p.y, r: 5, fill: o.kind === 'midpoint' || o.fixed ? c : 'var(--bg-card)', stroke: c, 'stroke-width': 2.2 }, g);
      if (o.label) el('text', { x: p.x - 9, y: p.y - 9, 'text-anchor': 'end', class: 'bd-svg-label' }, g).textContent = o.caption || o.name;
      break;
    }
  }
}

/* ==========================================================================
   Попадание мышью
   ========================================================================== */
function distSeg(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
function hitPoint(px) {
  let best = null, bd = 12;
  for (const o of state.objs) if (isPointKind(o)) { const p = toPx(pos(o.id)), d = Math.hypot(p.x - px.x, p.y - px.y); if (d < bd) { bd = d; best = o; } }
  return best;
}
function hitAny(px) {
  const pt = hitPoint(px); if (pt) return pt;
  const order = ['text', 'vector', 'segment', 'angle', 'line', 'circle', 'func', 'polygon'];
  for (const kind of order) for (const o of state.objs.filter((x) => x.kind === kind).reverse()) {
    if ((kind === 'segment' || kind === 'vector') && distSeg(px, toPx(pos(o.a)), toPx(pos(o.b))) < 7) return o;
    if (kind === 'line') {
      const a = toPx(pos(o.a)), b = toPx(pos(o.b)), dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
      if (Math.abs((px.x - a.x) * dy - (px.y - a.y) * dx) / l < 7) return o;
    }
    if (kind === 'angle') { const O = toPx(pos(o.o)); if (Math.hypot(px.x - O.x, px.y - O.y) < 30) return o; }
    if (kind === 'circle') { const C = toPx(pos(o.c)), P = toPx(pos(o.p)); if (Math.abs(Math.hypot(px.x - C.x, px.y - C.y) - Math.hypot(P.x - C.x, P.y - C.y)) < 7) return o; }
    if (kind === 'text') { const p = toPx(o); if (Math.abs(px.x - p.x) < Math.max(20, (o.text || '').length * 4) && Math.abs(px.y - p.y) < 12) return o; }
    if (kind === 'func') {
      const names = Object.keys(sliderVals()), fn = compileExpr(o.expr || '', names);
      if (fn) { const w = fromPx(px.x, px.y); try { const y = fn(w.x, ...names.map((k) => sliderVals()[k])); if (isFinite(y) && Math.abs(toPx({ x: w.x, y }).y - px.y) < 8) return o; } catch (e) {} }
    }
    if (kind === 'polygon') {
      const pts = o.pts.map((id) => toPx(pos(id)));
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        if ((pts[i].y > px.y) !== (pts[j].y > px.y) && px.x < (pts[j].x - pts[i].x) * (px.y - pts[i].y) / (pts[j].y - pts[i].y) + pts[i].x) inside = !inside;
      }
      if (inside) return o;
    }
  }
  return null;
}

/* ==========================================================================
   Мышь и касания
   ========================================================================== */
function evPx(e) { const r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function snapW(w) {
  const S = state.settings, hw = S.width / 2, hh = S.height / 2;
  let x = w.x, y = w.y;
  if (S.snap) { x = Math.round(x * 2) / 2; y = Math.round(y * 2) / 2; }
  return { x: Math.max(-hw, Math.min(hw, x)), y: Math.max(-hh, Math.min(hh, y)) };
}
// Точка под курсором или новая — для инструментов построения.
function pickPoint(px) {
  const hit = hitPoint(px);
  if (hit) return hit.id;
  const w = snapW(fromPx(px.x, px.y));
  return add({ kind: 'point', name: autoName('point'), x: w.x, y: w.y, label: true, fixed: false }).id;
}
let drag = null;
svg.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  const px = evPx(e);
  if (tool === 'select') {
    const hit = hitAny(px);
    selected = hit ? hit.id : null;
    if (hit) {
      // какие свободные точки двигать: саму точку или все вершины фигуры
      let movers = [];
      if (hit.kind === 'point') movers = [hit.id];
      else if (hit.kind === 'text') movers = [hit.id];
      else movers = [...new Set(collectFree(hit))];
      if (movers.length) {
        drag = { start: fromPx(px.x, px.y), orig: movers.map((id) => { const o = byId(id); return { id, x: o.x, y: o.y }; }), moved: false };
        svg.setPointerCapture(e.pointerId);
      }
    }
    refresh();
    return;
  }
  snapshot();
  if (tool === 'point') { selected = pickPoint(px); refresh(true); return; }
  if (tool === 'text') {
    const w = snapW(fromPx(px.x, px.y));
    selected = add({ kind: 'text', name: autoName('text'), x: w.x, y: w.y, text: 'Подпись' }).id;
    setTool('select'); refresh(true);
    setTimeout(() => { const t = document.querySelector('#bdProps [data-f="text"]'); if (t) { t.focus(); t.select(); } }, 0);
    return;
  }
  const id = pickPoint(px);
  if (tool === 'polygon') {
    if (pending.length >= 3 && id === pending[0]) { finishPolygon(); return; }
    if (!pending.includes(id)) pending.push(id);
    refresh(true); return;
  }
  if (pending[pending.length - 1] === id && tool !== 'angle') { refresh(true); return; }
  pending.push(id);
  const t = TOOLS.find((x) => x.id === tool);
  if (pending.length >= t.need) finishTool();
  refresh(true);
});
function collectFree(o, acc = []) {
  if (o.kind === 'point') { acc.push(o.id); return acc; }
  for (const r of refsOf(o)) { const x = byId(r); if (x) collectFree(x, acc); }
  return acc;
}
svg.addEventListener('pointermove', (e) => {
  const px = evPx(e), w = fromPx(px.x, px.y);
  $('bdCoords').textContent = `x = ${w.x.toFixed(2)}, y = ${w.y.toFixed(2)}`;
  if (drag) {
    if (!drag.moved) { snapshot(); drag.moved = true; }
    let dx = w.x - drag.start.x, dy = w.y - drag.start.y;
    if (state.settings.snap) { dx = Math.round(dx * 2) / 2; dy = Math.round(dy * 2) / 2; }
    const S = state.settings, hw = S.width / 2, hh = S.height / 2;
    // общий сдвиг ограничиваем так, чтобы ни одна точка не ушла за поле
    for (const o of drag.orig) { dx = Math.max(-hw - o.x, Math.min(hw - o.x, dx)); dy = Math.max(-hh - o.y, Math.min(hh - o.y, dy)); }
    for (const o of drag.orig) { const t = byId(o.id); t.x = o.x + dx; t.y = o.y + dy; }
    refresh();
    return;
  }
  if (pending.length) { cursor = snapW(w); const h = hitPoint(px); if (h) cursor = pos(h.id); draw(); }
});
svg.addEventListener('pointerup', () => { if (drag) { drag = null; refresh(true); } });
svg.addEventListener('pointerleave', () => { $('bdCoords').textContent = ''; });
svg.addEventListener('dblclick', (e) => {
  if (tool !== 'select') return;
  const hit = hitAny(evPx(e));
  if (hit) { const f = document.querySelector('#bdProps [data-f="name"]'); if (f) { f.focus(); f.select(); } }
});

function finishTool() {
  const [a, b, c] = pending;
  const nm = (id) => byId(id).name;
  if (tool === 'segment') selected = add({ kind: 'segment', name: autoName('segment', { from: nm(a) + nm(b) }), a, b }).id;
  if (tool === 'line') selected = add({ kind: 'line', name: autoName('line', { from: 'l' + nm(a) + nm(b) }), a, b }).id;
  if (tool === 'vector') selected = add({ kind: 'vector', name: autoName('vector', { from: 'v' + nm(a) + nm(b) }), a, b }).id;
  if (tool === 'circle') selected = add({ kind: 'circle', name: autoName('circle'), c: a, p: b }).id;
  if (tool === 'midpoint') selected = add({ kind: 'midpoint', name: autoName('midpoint'), a, b, label: true }).id;
  if (tool === 'angle') {
    if (a === b || b === c || a === c) { pending = []; PG.toast('Для угла нужны три разные точки'); return; }
    selected = add({ kind: 'angle', name: autoName('angle', { from: 'ang' + nm(a) + nm(b) + nm(c) }), a, o: b, b: c, arcs: 1 }).id;
  }
  pending = [];
}
function finishPolygon() {
  if (pending.length < 3) { PG.toast('У многоугольника минимум три вершины'); return; }
  const pts = pending.slice();
  selected = add({ kind: 'polygon', name: autoName('polygon', { pts, from: pts.map((id) => byId(id).name).join('') }), pts, fill: true }).id;
  pending = [];
  refresh(true);
}

/* ==========================================================================
   Панель свойств и список
   ========================================================================== */
const props = $('bdProps');
let focusSnap = false;
props.addEventListener('focusin', () => { if (!focusSnap) { snapshot(); focusSnap = true; } });
props.addEventListener('focusout', () => { focusSnap = false; });
const escH = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const field = (label, f, value, type = 'text', extra = '') =>
  `<label>${label}<input type="${type}" data-f="${f}" value="${escH(value ?? '')}" ${extra}></label>`;
const check = (label, f, on) => `<label class="chk"><input type="checkbox" data-f="${f}" ${on ? 'checked' : ''}>${label}</label>`;
function swatches(o) {
  return `<label>Цвет<div class="sw">${COLORS.map((c) => `<button type="button" data-color="${c}" class="${c ? '' : 'auto'} ${o.color === c ? 'on' : ''}" style="${c ? 'background:' + c : ''}" title="${c || 'по теме (рекомендуется)'}"></button>`).join('')}</div></label>`;
}
function renderProps() {
  const o = selected && byId(selected);
  if (!o) {
    const S = state.settings;
    props.innerHTML = `<div class="muted">Ничего не выбрано — настройки сцены.</div>` +
      field('Ширина поля', 'width', S.width, 'number', 'min="4" max="60" step="1"') +
      field('Высота поля', 'height', S.height, 'number', 'min="4" max="40" step="1"') +
      check('Оси координат', 'axes', S.axes) + check('Сетка', 'grid', S.grid) + check('Привязка к сетке (шаг 0,5)', 'snap', S.snap) +
      `<label>Описание<textarea data-f="description" placeholder="Текст под сценой">${escH(S.description)}</textarea></label>` +
      `<div class="muted">Ctrl+Z / Ctrl+Y — отмена и повтор, Delete — удалить выбранное, Esc — прервать построение.</div>`;
    return;
  }
  let h = `<div class="muted">${KIND[o.kind].title}</div>` + field('Имя', 'name', o.name);
  const refs = refsOf(o).map((r) => (byId(r) || {}).name).filter(Boolean);
  if (refs.length) h += `<div class="muted">Через: ${refs.map(escH).join(', ')}</div>`;
  if (o.kind === 'point') h += field('x', 'x', num(o.x), 'number', 'step="0.5"') + field('y', 'y', num(o.y), 'number', 'step="0.5"') +
    check('Зафиксировать (нельзя тащить в сцене)', 'fixed', o.fixed);
  if (isPointKind(o)) h += check('Подпись', 'label', o.label) + (o.label ? field('Текст подписи', 'caption', o.caption || '', 'text', `placeholder="${escH(o.name)}"`) : '');
  if (o.kind === 'polygon') h += check('Заливка', 'fill', o.fill);
  if (o.kind === 'angle') h += field('Число дуг', 'arcs', o.arcs || 1, 'number', 'min="1" max="3" step="1"');
  if (o.kind === 'func') {
    const ok = !!compileExpr(o.expr || '', Object.keys(sliderVals()));
    h += `<label>f(x) =<input type="text" data-f="expr" value="${escH(o.expr)}" class="${ok ? '' : 'bad'}" spellcheck="false"></label>` +
      `<div class="muted">Например: <code>a*sin(x)</code>, <code>x^2/4 - 1</code>. Можно использовать ползунки по имени.</div>` +
      field('x от', 'xmin', o.xmin ?? '', 'number', 'placeholder="край поля"') + field('x до', 'xmax', o.xmax ?? '', 'number', 'placeholder="край поля"');
  }
  if (o.kind === 'slider') h += field('Подпись', 'label', o.label || '') + field('Значение', 'value', o.value, 'number', `step="${o.step}"`) +
    field('Минимум', 'min', o.min, 'number') + field('Максимум', 'max', o.max, 'number') + field('Шаг', 'step', o.step, 'number', 'min="0.001"');
  if (o.kind === 'text') h += field('Текст', 'text', o.text) + field('x', 'x', num(o.x), 'number', 'step="0.5"') + field('y', 'y', num(o.y), 'number', 'step="0.5"');
  if (o.kind !== 'slider') h += swatches(o);
  if (['point', 'midpoint', 'segment', 'vector', 'line', 'circle', 'angle', 'slider'].includes(o.kind)) h += check('Показывать значение в описании', 'measure', o.measure);
  h += `<div class="row2"><button class="btn" data-act="delete">Удалить</button></div>`;
  props.innerHTML = h;
}
props.addEventListener('input', (e) => {
  const f = e.target.dataset.f; if (!f) return;
  const o = selected && byId(selected);
  const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (!o) {
    const S = state.settings;
    if (f === 'width' || f === 'height') { const n = +v; if (n >= 4 && n <= 60) S[f] = n; else return; }
    else S[f] = v;
    refresh(e.target.type === 'checkbox');
    return;
  }
  if (f === 'name') {
    const ok = nameOk(v, o);
    e.target.classList.toggle('bad', !ok);
    if (ok) { o.name = v; refresh(); }
    return;
  }
  if (['x', 'y', 'value', 'min', 'max', 'step', 'arcs'].includes(f)) { if (v === '' || !isFinite(+v)) return; o[f] = +v; }
  else o[f] = v;
  if (f === 'expr') e.target.classList.toggle('bad', !compileExpr(v, Object.keys(sliderVals())));
  refresh(e.target.type === 'checkbox' || f === 'label');
});
props.addEventListener('click', (e) => {
  const sw = e.target.closest('[data-color]');
  const o = selected && byId(selected);
  if (sw && o) { snapshot(); o.color = sw.dataset.color; refresh(true); return; }
  if (e.target.closest('[data-act="delete"]') && o) { snapshot(); remove(o.id); refresh(true); }
});

function renderList() {
  const list = $('bdList');
  $('bdCount').textContent = state.objs.length || '';
  if (!state.objs.length) { list.innerHTML = '<div class="empty">Пока пусто</div>'; return; }
  list.innerHTML = state.objs.map((o) => {
    const refs = refsOf(o).map((r) => (byId(r) || {}).name).join(', ');
    const sub = o.kind === 'func' ? 'f(x) = ' + (o.expr || '') : o.kind === 'slider' ? num(o.min) + '…' + num(o.max) : refs;
    return `<button type="button" data-id="${o.id}" class="${o.id === selected ? 'on' : ''}"><span class="dot" style="${o.color ? 'background:' + o.color : ''}"></span>` +
      `${KIND[o.kind].glyph} ${escH(o.name)}<small>${escH(sub)}</small></button>`;
  }).join('');
}
$('bdList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-id]'); if (!b) return;
  selected = b.dataset.id; setTool('select'); refresh(true);
});

/* ==========================================================================
   Панель инструментов
   ========================================================================== */
const tb = $('bdTools');
tb.innerHTML = TOOLS.map((t) => `<button type="button" class="btn tool" data-tool="${t.id}">${t.label}</button>`).join('') +
  `<span class="sep"></span><button type="button" class="btn" data-act="func">+ График</button>` +
  `<button type="button" class="btn" data-act="slider">+ Ползунок</button>` +
  `<span class="sep"></span><button type="button" class="btn" data-act="undo" title="Ctrl+Z">↶</button>` +
  `<button type="button" class="btn" data-act="redo" title="Ctrl+Y">↷</button>` +
  `<button type="button" class="btn" data-act="clear">Очистить</button>`;
function setTool(id) {
  tool = id; pending = []; cursor = null;
  tb.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === id));
  $('bdHint').textContent = TOOLS.find((t) => t.id === id).hint;
  draw();
}
tb.addEventListener('click', (e) => {
  const t = e.target.closest('[data-tool]');
  if (t) { setTool(t.dataset.tool); return; }
  const a = e.target.closest('[data-act]'); if (!a) return;
  const act = a.dataset.act;
  if (act === 'undo') undo();
  if (act === 'redo') redo();
  if (act === 'clear') {
    if (!state.objs.length || !confirm('Удалить все объекты конструктора?')) return;
    snapshot(); state.objs = []; selected = null; pending = []; refresh(true);
  }
  if (act === 'func') {
    snapshot();
    const sl = state.objs.find((o) => o.kind === 'slider');
    selected = add({ kind: 'func', name: autoName('func'), expr: sl ? sl.name + ' * sin(x)' : 'x^2 / 4 - 2', xmin: '', xmax: '', color: '#3b82f6' }).id;
    setTool('select'); refresh(true);
  }
  if (act === 'slider') {
    snapshot();
    selected = add({ kind: 'slider', name: autoName('slider'), label: '', min: -5, max: 5, step: 0.1, value: 1 }).id;
    setTool('select'); refresh(true);
  }
});

document.addEventListener('keydown', (e) => {
  if ($('viewBuilder').hidden) return;
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  const mod = e.ctrlKey || e.metaKey;
  if (mod && !typing && (e.key === 'z' || e.key === 'я') && !e.shiftKey) { e.preventDefault(); undo(); return; }
  if (mod && !typing && (e.key === 'y' || e.key === 'н' || ((e.key === 'z' || e.key === 'Z') && e.shiftKey))) { e.preventDefault(); redo(); return; }
  if (typing) return;
  if (e.key === 'Escape') { if (pending.length) { pending = []; draw(); } else { selected = null; refresh(); } }
  if (e.key === 'Enter' && tool === 'polygon' && pending.length) { snapshot(); finishPolygon(); }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { e.preventDefault(); snapshot(); remove(selected); refresh(true); }
});

/* ==========================================================================
   Код и связь с редактором
   ========================================================================== */
let lastCode = '';
function renderCode() {
  const src = generate();
  if (src === lastCode) return;
  lastCode = src;
  $('bdCode').innerHTML = PG.highlight(src);
}
$('bdCopy').onclick = async () => { try { await navigator.clipboard.writeText(generate()); PG.toast('Код скопирован'); } catch (e) { PG.toast('Не удалось скопировать'); } };
$('bdToEditor').onclick = () => {
  const src = generate();
  const r = PG.compile(src);
  if (!r.success) PG.toast('Внимание: компилятор нашёл ошибки — проверьте в редакторе');
  PG.openCode(src, 'constructor.gms');
};

// full=true — перерисовать и панели (после структурных изменений); иначе — только поле и код.
function refresh(full) {
  draw();
  renderList();
  if (full || !props.contains(document.activeElement)) renderProps();
  renderCode();
  save();
}

new ResizeObserver(() => { if (!$('viewBuilder').hidden) draw(); }).observe(stage);
window.mfBuilder = { show() { setTool(tool); refresh(true); }, generate, get state() { return state; } };
setTool('select');
if (!$('viewBuilder').hidden) window.mfBuilder.show();
