// assets/js/playground-builder.js
// Визуальный конструктор песочницы (/playground/#builder): сцена собирается мышью —
// точки, отрезки, прямые, векторы, окружности, многоугольники, углы, середины,
// графики функций, ползунки и подписи, а в режиме 3D — точки в пространстве, рёбра,
// грани, плоскости, тела (Primitive) и поверхности, — а GMS-код по ней пишется автоматически и
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
  plane:    { title: 'Плоскость', glyph: '◇' },
  solid:    { title: 'Тело', glyph: '■' },
  surface:  { title: 'Поверхность', glyph: '≋' },
};
// Тела 3D: подпись и набор размеров, которые читает компилятор (см. parsePrimitiveBlock).
const SOLIDS = {
  cube: { title: 'Куб', dims: ['edge'] },
  box: { title: 'Параллелепипед', dims: ['width', 'height', 'depth'] },
  sphere: { title: 'Шар', dims: ['radius'] },
  cylinder: { title: 'Цилиндр', dims: ['radius', 'height'] },
  cone: { title: 'Конус', dims: ['radius', 'height'] },
  pyramid: { title: 'Пирамида', dims: ['radius', 'height', 'sides'] },
  prism: { title: 'Призма', dims: ['radius', 'height', 'sides'] },
  tetrahedron: { title: 'Тетраэдр', dims: ['edge'] },
  octahedron: { title: 'Октаэдр', dims: ['edge'] },
  dodecahedron: { title: 'Додекаэдр', dims: ['edge'] },
  icosahedron: { title: 'Икосаэдр', dims: ['edge'] },
  torus: { title: 'Тор', dims: ['radius', 'tube'] },
};
const DIM_LABEL = { edge: 'Ребро', width: 'Ширина (x)', height: 'Высота (y)', depth: 'Глубина (z)', radius: 'Радиус', tube: 'Толщина', sides: 'Число граней' };
const DIM_DEFAULT = { edge: 2, width: 3, height: 2, depth: 2, radius: 1.5, tube: 0.5, sides: 4 };
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
  { id: 'plane', label: 'Плоскость', need: 3, hint: 'Щёлкните три точки плоскости' },
];
// Какие инструменты есть в каждом режиме.
const TOOLS_2D = ['select', 'point', 'segment', 'line', 'vector', 'circle', 'polygon', 'angle', 'midpoint', 'text'];
const TOOLS_3D = ['select', 'point', 'segment', 'vector', 'polygon', 'plane', 'midpoint'];
const HINT_3D = {
  select: 'Тащите точки и тела (Shift — по вертикали), пустое место — вращать вид, колесо — масштаб',
  point: 'Щёлкните — точка встанет на рабочую плоскость y = const (высота — в настройках сцены)',
};

let state = load() || freshState();
let tool = 'select', pending = [], selected = null, cursor = null;
let undoStack = [], redoStack = [];
let view = { s: 40, cx: 0, cy: 0 }; // пикселей на единицу и центр поля в пикселях

function freshState() {
  return { settings: { mode: '2d', width: 20, height: 12, depth: 10, axes: true, grid: true, snap: true, description: '',
    rotA: 45, rotP: 60, zoom: 1, workY: 0 }, objs: [], seq: 1 };
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_STATE));
    if (!s || !Array.isArray(s.objs)) return null;
    s.settings = Object.assign(freshState().settings, s.settings); // старые сохранения — без полей 3D
    return s;
  } catch (e) { return null; }
}
const is3D = () => state.settings.mode === '3d';
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
  renderToolbar(); setTool(tool);
  refresh(true);
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(state));
  state = JSON.parse(redoStack.pop());
  if (selected && !byId(selected)) selected = null;
  renderToolbar(); setTool(tool);
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
    case 'plane': return [o.a, o.b, o.c];
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
    case 'surface': return [n, n + '_s'];
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
  const prefix = { segment: 's', line: 'l', vector: 'v', circle: 'w', polygon: 'F', angle: 'ang', func: 'f', slider: 'a', text: 'txt',
    plane: 'pl', solid: 'body', surface: 'surf' }[kind] || 'o';
  if (kind === 'slider') for (const L of 'abcdkmnpqruv') if (free(L)) return L;
  if (kind === 'func' || kind === 'surface') for (const L of ['f', 'g', 'h', 'p', 'q']) if (free(L)) return L;
  if (kind === 'solid' && extra && extra.type) { if (free(extra.type)) return extra.type; for (let i = 2; ; i++) if (free(extra.type + i)) return extra.type + i; }
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
  if (!o) return { x: 0, y: 0, z: 0 };
  if (o.kind === 'point') return { x: o.x, y: o.y, z: o.z || 0 };
  if (o.kind === 'midpoint') { const a = pos(o.a), b = pos(o.b); return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }; }
  return { x: 0, y: 0, z: 0 };
}
const sliderVals = () => Object.fromEntries(state.objs.filter((o) => o.kind === 'slider').map((o) => [o.name, +o.value]));

/* ---- выражения функций: GMS → JS только для предпросмотра на поле ---- */
const MATH = { sin: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan', asin: 'Math.asin', acos: 'Math.acos', atan: 'Math.atan',
  sqrt: 'Math.sqrt', abs: 'Math.abs', exp: 'Math.exp', log: 'Math.log', log2: 'Math.log2', log10: 'Math.log10',
  floor: 'Math.floor', ceil: 'Math.ceil', round: 'Math.round', sign: 'Math.sign', min: 'Math.min', max: 'Math.max', pow: 'Math.pow',
  sinh: 'Math.sinh', cosh: 'Math.cosh', tanh: 'Math.tanh', cbrt: 'Math.cbrt', pi: 'Math.PI', PI: 'Math.PI', E: 'Math.E', tau: '(2*Math.PI)' };
const fnCache = new Map();
function compileExpr(expr, vars, args = ['x']) {
  const key = expr + '|' + vars.join(',') + '|' + args.join(',');
  if (fnCache.has(key)) return fnCache.get(key);
  let fn = null;
  try {
    if (!/^[\w\s+\-*/^().,%<>=!?:&|]*$/.test(expr)) throw 0;
    const js = expr.replace(/\^/g, '**').replace(/[A-Za-z_][A-Za-z0-9_]*/g, (w) => {
      if (args.includes(w) || vars.includes(w)) return w;
      if (MATH[w]) return MATH[w];
      throw 0;
    });
    fn = new Function(...args, ...vars, '"use strict"; return (' + js + ');');
    fn(...args.map(() => 0.5), ...vars.map(() => 1));
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
  if (is3D()) return generate3D();
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
  if (is3D()) return draw3D();
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
  for (const o of state.objs) if (isPointKind(o)) { const p = is3D() ? proj(pos(o.id)) : toPx(pos(o.id)), d = Math.hypot(p.x - px.x, p.y - px.y); if (d < bd) { bd = d; best = o; } }
  return best;
}
function hitAny(px) {
  const pt = hitPoint(px); if (pt) return pt;
  if (is3D()) return hitAny3D(px);
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
  if (is3D()) {
    const w = planeAt(px, state.settings.workY); if (!w) return null;
    const q = clamp3(snap3(w));
    return add({ kind: 'point', name: autoName('point'), x: q.x, y: q.y, z: q.z, label: true, fixed: false }).id;
  }
  const w = snapW(fromPx(px.x, px.y));
  return add({ kind: 'point', name: autoName('point'), x: w.x, y: w.y, label: true, fixed: false }).id;
}
let drag = null;
svg.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  const px = evPx(e);
  if (is3D() && tool === 'select') { down3D(e, px); return; }
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
  if (tool === 'point') { const id = pickPoint(px); if (id) selected = id; else undoStack.pop(); refresh(true); return; }
  if (tool === 'text') {
    const w = snapW(fromPx(px.x, px.y));
    selected = add({ kind: 'text', name: autoName('text'), x: w.x, y: w.y, text: 'Подпись' }).id;
    setTool('select'); refresh(true);
    setTimeout(() => { const t = document.querySelector('#bdProps [data-f="text"]'); if (t) { t.focus(); t.select(); } }, 0);
    return;
  }
  const id = pickPoint(px);
  if (!id) { PG.toast('Поверните вид: рабочая плоскость видна с ребра'); undoStack.pop(); return; }
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
  const px = evPx(e);
  if (is3D()) { move3D(e, px); return; }
  const w = fromPx(px.x, px.y);
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
svg.addEventListener('pointerup', () => { if (drag) { drag = null; refresh(true); } if (orbit) { orbit = null; save(); } });
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
  if (tool === 'plane') {
    if (a === b || b === c || a === c) { pending = []; PG.toast('Для плоскости нужны три разные точки'); return; }
    selected = add({ kind: 'plane', name: autoName('plane', { from: 'pl' + nm(a) + nm(b) + nm(c) }), a, b, c }).id;
  }
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
    props.innerHTML = `<div class="muted">Ничего не выбрано — настройки ${is3D() ? '3D-' : ''}сцены.</div>` +
      field('Ширина поля (x)', 'width', S.width, 'number', 'min="4" max="60" step="1"') +
      field('Высота поля (y)', 'height', S.height, 'number', 'min="4" max="40" step="1"') +
      (is3D() ? field('Глубина поля (z)', 'depth', S.depth, 'number', 'min="4" max="60" step="1"') +
        field('Рабочая плоскость y =', 'workY', S.workY, 'number', 'step="0.5"') +
        `<div class="muted">Новые точки ставятся на плоскость y = ${num(S.workY)}. Вид сцены (поворот) попадёт в код как начальная камера.</div>` : '') +
      check('Оси координат', 'axes', S.axes) + check('Сетка', 'grid', S.grid) + check('Привязка к сетке (шаг 0,5)', 'snap', S.snap) +
      `<label>Описание<textarea data-f="description" placeholder="Текст под сценой">${escH(S.description)}</textarea></label>` +
      `<div class="muted">Ctrl+Z / Ctrl+Y — отмена и повтор, Delete — удалить выбранное, Esc — прервать построение.</div>`;
    return;
  }
  let h = `<div class="muted">${KIND[o.kind].title}</div>` + field('Имя', 'name', o.name);
  const refs = refsOf(o).map((r) => (byId(r) || {}).name).filter(Boolean);
  if (refs.length) h += `<div class="muted">Через: ${refs.map(escH).join(', ')}</div>`;
  if (o.kind === 'point') h += field('x', 'x', num(o.x), 'number', 'step="0.5"') + field('y', 'y', num(o.y), 'number', 'step="0.5"') +
    (is3D() ? field('z', 'z', num(o.z || 0), 'number', 'step="0.5"') : '') +
    check('Зафиксировать (нельзя тащить в сцене)', 'fixed', o.fixed);
  if (o.kind === 'solid') {
    h += `<label>Тип<select data-f="type">${Object.entries(SOLIDS).map(([k, v]) => `<option value="${k}" ${k === o.type ? 'selected' : ''}>${v.title}</option>`).join('')}</select></label>` +
      field('Центр x', 'x', num(o.x), 'number', 'step="0.5"') + field('Центр y', 'y', num(o.y), 'number', 'step="0.5"') + field('Центр z', 'z', num(o.z), 'number', 'step="0.5"') +
      SOLIDS[o.type].dims.map((d) => field(DIM_LABEL[d], d, o[d] ?? DIM_DEFAULT[d], 'number', d === 'sides' ? 'min="3" max="12" step="1"' : 'min="0.1" step="0.1"')).join('') +
      field('Непрозрачность', 'opacity', o.opacity ?? 0.6, 'number', 'min="0.05" max="1" step="0.05"') + check('Каркас', 'wireframe', o.wireframe);
  }
  if (o.kind === 'surface') {
    const ok = !!compileExpr(o.expr || '', Object.keys(sliderVals()), ['x', 'z']);
    h += `<label>y = f(x, z) =<input type="text" data-f="expr" value="${escH(o.expr)}" class="${ok ? '' : 'bad'}" spellcheck="false"></label>` +
      `<div class="muted">Вертикальная ось сцены — y. Например: <code>sin(x)*cos(z)</code>, <code>(x^2 - z^2)/8</code>.</div>` +
      field('Непрозрачность', 'opacity', o.opacity ?? 0.7, 'number', 'min="0.05" max="1" step="0.05"');
  }
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
  if (['point', 'midpoint', 'segment', 'vector', 'line', 'circle', 'angle', 'slider'].includes(o.kind) && (!is3D() || ['point', 'midpoint', 'segment', 'slider'].includes(o.kind))) h += check('Показывать значение в описании', 'measure', o.measure);
  h += `<div class="row2"><button class="btn" data-act="delete">Удалить</button></div>`;
  props.innerHTML = h;
}
props.addEventListener('input', (e) => {
  const f = e.target.dataset.f; if (!f) return;
  const o = selected && byId(selected);
  const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (!o) {
    const S = state.settings;
    if (f === 'width' || f === 'height' || f === 'depth') { const n = +v; if (n >= 4 && n <= 60) S[f] = n; else return; }
    else if (f === 'workY') { if (v === '' || !isFinite(+v)) return; S.workY = Math.max(-S.height / 2, Math.min(S.height / 2, +v)); }
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
  if (['x', 'y', 'z', 'value', 'min', 'max', 'step', 'arcs', 'opacity', ...Object.keys(DIM_LABEL)].includes(f)) {
    if (v === '' || !isFinite(+v)) return;
    o[f] = f === 'sides' ? Math.max(3, Math.min(12, Math.round(+v))) : +v;
  }
  else o[f] = v;
  if (f === 'expr') e.target.classList.toggle('bad', !compileExpr(v, Object.keys(sliderVals()), o.kind === 'surface' ? ['x', 'z'] : ['x']));
  refresh(e.target.type === 'checkbox' || f === 'label' || f === 'type');
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
    const sub = o.kind === 'func' ? 'f(x) = ' + (o.expr || '') : o.kind === 'surface' ? 'y = ' + (o.expr || '')
      : o.kind === 'solid' ? SOLIDS[o.type].title : o.kind === 'slider' ? num(o.min) + '…' + num(o.max) : refs;
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
// Иконки инструментов (24×24, обводка — как иконки шапки сайта).
const SVG = (d, fill) => `<svg viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  select: SVG('<path d="M5 3l14 8-6 1.5L10 19z"/>'),
  point: SVG('<circle cx="12" cy="12" r="3.2" fill="currentColor"/><circle cx="12" cy="12" r="7" opacity=".35"/>'),
  segment: SVG('<path d="M6 18 18 6"/><circle cx="6" cy="18" r="2" fill="currentColor"/><circle cx="18" cy="6" r="2" fill="currentColor"/>'),
  line: SVG('<path d="M3 21 21 3"/><circle cx="9" cy="15" r="1.8" fill="currentColor"/><circle cx="15" cy="9" r="1.8" fill="currentColor"/>'),
  vector: SVG('<path d="M5 19 18 6"/><path d="M11 6h7v7"/>'),
  circle: SVG('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>'),
  polygon: SVG('<path d="M5 18 8 6l11 3-2 9z"/>'),
  angle: SVG('<path d="M4 19h16"/><path d="M4 19 15 5"/><path d="M10 19a6 6 0 0 0-2.4-4.8"/>'),
  midpoint: SVG('<path d="M4 18 20 6"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/><path d="M9 9.5l-1-1.5M15 14.5l1 1.5" opacity=".5"/>'),
  text: SVG('<path d="M5 6V4h14v2M12 4v16M9 20h6"/>'),
  plane: SVG('<path d="M3 16 9 8h12l-6 8z"/>'),
  func: SVG('<path d="M3 17c3 0 4-10 9-10s6 10 9 10"/>'),
  slider: SVG('<path d="M4 12h16"/><circle cx="10" cy="12" r="3" fill="currentColor"/>'),
  solid: SVG('<path d="M12 3 4 7.5v9L12 21l8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>'),
  surface: SVG('<path d="M3 15c3-4 6 2 9-2s6 2 9-2"/><path d="M3 19c3-4 6 2 9-2s6 2 9-2" opacity=".5"/>'),
  view: SVG('<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>'),
  undo: SVG('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
  redo: SVG('<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>'),
  clear: SVG('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
};
function renderToolbar() {
  const ids = is3D() ? TOOLS_3D : TOOLS_2D;
  const tools = ids.map((id) => { const t = TOOLS.find((x) => x.id === id);
    return `<button type="button" class="pal-btn" data-tool="${id}" title="${escH(t.hint)}">${ICON[id] || ''}<span>${t.label}</span></button>`; }).join('');
  tb.innerHTML =
    `<div class="seg text" role="group" aria-label="Режим конструктора"><button type="button" data-mode="2d" class="${is3D() ? '' : 'on'}">2D</button><button type="button" data-mode="3d" class="${is3D() ? 'on' : ''}">3D</button></div>` +
    `<div class="palette" role="group" aria-label="Инструменты">${tools}</div>` +
    `<span class="tb-gap"></span>` +
    (is3D()
      ? `<label class="btn ghost sel-btn">${ICON.solid}<span>Тело</span><select class="bd-add" data-act="solid" aria-label="Добавить тело"><option value="">Тело…</option>${Object.entries(SOLIDS).map(([k, v]) => `<option value="${k}">${v.title}</option>`).join('')}</select></label>` +
        `<button type="button" class="btn ghost" data-act="surface">${ICON.surface}Поверхность</button>`
      : `<button type="button" class="btn ghost" data-act="func">${ICON.func}График</button>`) +
    `<button type="button" class="btn ghost" data-act="slider">${ICON.slider}Ползунок</button>` +
    '';
  // История и вид — в шапке поля, рядом с тем, на что действуют.
  $('bdHist').innerHTML =
    (is3D() ? `<button type="button" class="ib" data-act="view" title="Вернуть начальный вид" aria-label="Вернуть начальный вид">${ICON.view}</button>` : '') +
    `<button type="button" class="ib" data-act="undo" title="Отменить (Ctrl+Z)" aria-label="Отменить">${ICON.undo}</button>` +
    `<button type="button" class="ib" data-act="redo" title="Повторить (Ctrl+Y)" aria-label="Повторить">${ICON.redo}</button>` +
    `<button type="button" class="ib" data-act="clear" title="Очистить сцену" aria-label="Очистить сцену">${ICON.clear}</button>`;
}
function setTool(id) {
  const ids = is3D() ? TOOLS_3D : TOOLS_2D;
  if (!ids.includes(id)) id = 'select';
  tool = id; pending = []; cursor = null;
  tb.querySelectorAll('[data-tool]').forEach((b) => { b.classList.toggle('on', b.dataset.tool === id); b.setAttribute('aria-pressed', b.dataset.tool === id); });
  $('bdHint').textContent = (is3D() && HINT_3D[id]) || TOOLS.find((t) => t.id === id).hint;
  draw();
}
// Переключение 2D ↔ 3D: объекты одного режима в другом не имеют смысла, поэтому сцена очищается
// (с подтверждением; отмена Ctrl+Z вернёт её вместе с режимом).
function setMode(mode) {
  if (state.settings.mode === mode) return;
  if (state.objs.length && !confirm('Переключение режима очистит сцену конструктора. Продолжить?')) return;
  snapshot();
  state.objs = []; selected = null; pending = [];
  const S = state.settings;
  S.mode = mode;
  if (mode === '3d') { S.width = 10; S.height = 8; S.depth = 10; S.rotA = 45; S.rotP = 60; S.zoom = 1; S.workY = 0; }
  else { S.width = 20; S.height = 12; }
  renderToolbar(); setTool('select'); refresh(true);
}
tb.addEventListener('change', (e) => {
  const sel = e.target.closest('[data-act="solid"]'); if (!sel || !sel.value) return;
  const type = sel.value; sel.value = '';
  snapshot();
  const o = { kind: 'solid', type, name: autoName('solid', { type }), x: 0, y: 0, z: 0, opacity: 0.6, wireframe: false };
  for (const d of SOLIDS[type].dims) o[d] = DIM_DEFAULT[d];
  if (type === 'prism') o.sides = 6;
  o.y = Math.min(state.settings.height / 2, (o.height || o.edge || o.radius * 2 || 2) / 2);
  selected = add(o).id;
  setTool('select'); refresh(true);
});
$('bdHist').addEventListener('click', (e) => onToolbarClick(e));
tb.addEventListener('click', (e) => onToolbarClick(e));
function onToolbarClick(e) {
  const md = e.target.closest('[data-mode]');
  if (md) { setMode(md.dataset.mode); return; }
  const t = e.target.closest('[data-tool]');
  if (t) { setTool(t.dataset.tool); return; }
  const a = e.target.closest('[data-act]'); if (!a) return;
  const act = a.dataset.act;
  if (act === 'solid') return;
  if (act === 'view') { const S = state.settings; S.rotA = 45; S.rotP = 60; S.zoom = 1; refresh(); }
  if (act === 'surface') {
    snapshot();
    const sl = state.objs.find((o) => o.kind === 'slider');
    selected = add({ kind: 'surface', name: autoName('surface'), expr: (sl ? sl.name + ' * ' : '') + 'sin(x) * cos(z)', opacity: 0.7, color: '#3b82f6' }).id;
    setTool('select'); refresh(true);
  }
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
}

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
/* ==========================================================================
   3D: проекция, отрисовка, мышь, код
   --------------------------------------------------------------------------
   Камера — та же, что в скомпилированной сцене (render-3d.js › updateCameraPosition):
   направление на камеру (sinφ·sinθ, cosφ, sinφ·cosθ), θ = rotA, φ = rotP, ось y вверх.
   Поэтому вид в конструкторе совпадает с начальным видом сцены (camera start rot).
   Проекция ортографическая — для построения нагляднее перспективы.
   ========================================================================== */
let cam = null, orbit = null;
const dot3 = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
function camBasis() {
  const S = state.settings, th = S.rotA * Math.PI / 180, ph = S.rotP * Math.PI / 180;
  const c = { x: Math.sin(ph) * Math.sin(th), y: Math.cos(ph), z: Math.sin(ph) * Math.cos(th) };
  const rl = Math.hypot(c.z, c.x) || 1e-9;
  const r = { x: c.z / rl, y: 0, z: -c.x / rl };
  const u = { x: c.y * r.z - c.z * r.y, y: c.z * r.x - c.x * r.z, z: c.x * r.y - c.y * r.x };
  return { c, r, u };
}
function layout3D() {
  const rect = stage.getBoundingClientRect(), S = state.settings;
  const ext = Math.hypot(S.width, S.height, S.depth);
  view.s = Math.max(4, Math.min(rect.width, rect.height) / (ext * 1.05) * S.zoom);
  view.cx = rect.width / 2; view.cy = rect.height / 2;
  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  cam = camBasis();
}
function proj(p) {
  return { x: view.cx + dot3(p, cam.r) * view.s, y: view.cy - dot3(p, cam.u) * view.s, d: dot3(p, cam.c) };
}
// Точка поля под курсором на горизонтальной плоскости y = h (null, если плоскость видна с ребра).
function planeAt(px, h) {
  if (!cam || Math.abs(cam.c.y) < 0.06) return null;
  const sx = (px.x - view.cx) / view.s, sy = (view.cy - px.y) / view.s;
  const t = (h - sy * cam.u.y) / cam.c.y;
  return { x: sx * cam.r.x + sy * cam.u.x + t * cam.c.x, y: h, z: sx * cam.r.z + sy * cam.u.z + t * cam.c.z };
}
function snap3(p) {
  if (!state.settings.snap) return p;
  const q = (v) => Math.round(v * 2) / 2;
  return { x: q(p.x), y: q(p.y), z: q(p.z) };
}
function clamp3(p) {
  const S = state.settings, c = (v, m) => Math.max(-m / 2, Math.min(m / 2, v));
  return { x: c(p.x, S.width), y: c(p.y, S.height), z: c(p.z, S.depth) };
}

/* ---- каркасы тел (те же размеры, что у геометрий three.js в render-3d.js) ---- */
function ring(n, r, y, start = 0) {
  const v = [];
  for (let k = 0; k < n; k++) { const t = start + 2 * Math.PI * k / n; v.push({ x: r * Math.sin(t), y, z: r * Math.cos(t) }); }
  return v;
}
function loopEdges(off, n) { const e = []; for (let k = 0; k < n; k++) e.push([off + k, off + (k + 1) % n]); return e; }
function nearestEdges(v) {
  // рёбра правильного многогранника — пары вершин на минимальном расстоянии
  let m = Infinity;
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) m = Math.min(m, Math.hypot(v[i].x - v[j].x, v[i].y - v[j].y, v[i].z - v[j].z));
  const e = [];
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (Math.hypot(v[i].x - v[j].x, v[i].y - v[j].y, v[i].z - v[j].z) < m * 1.01) e.push([i, j]);
  return e;
}
const scaleTo = (v, R) => v.map((p) => { const l = Math.hypot(p.x, p.y, p.z) || 1; return { x: p.x / l * R, y: p.y / l * R, z: p.z / l * R }; });
function solidMesh(o) {
  const d = (k) => +(o[k] ?? DIM_DEFAULT[k]);
  let v = [], e = [];
  switch (o.type) {
    case 'cube': case 'box': {
      const [w, h, dd] = o.type === 'cube' ? [d('edge'), d('edge'), d('edge')] : [d('width'), d('height'), d('depth')];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) v.push({ x: sx * w / 2, y: sy * h / 2, z: sz * dd / 2 });
      e = nearestEdges(v).length === 12 ? nearestEdges(v) : [];
      if (!e.length) for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) if ([1, 2, 4].includes(i ^ j)) e.push([i, j]);
      break;
    }
    case 'cylinder': case 'prism': case 'cone': case 'pyramid': {
      const n = (o.type === 'prism' || o.type === 'pyramid') ? Math.round(d('sides')) : 24;
      const R = d('radius'), H = d('height');
      v = ring(n, R, -H / 2);
      e = loopEdges(0, n);
      const step = n > 12 ? n / 8 : 1;
      if (o.type === 'cylinder' || o.type === 'prism') {
        v.push(...ring(n, R, H / 2)); e.push(...loopEdges(n, n));
        for (let k = 0; k < n; k += step) e.push([k, n + k]);
      } else {
        v.push({ x: 0, y: H / 2, z: 0 });
        for (let k = 0; k < n; k += step) e.push([k, n]);
      }
      break;
    }
    case 'sphere': {
      const R = d('radius'), n = 32;
      for (const lat of [-50, 0, 50]) { const off = v.length, a = lat * Math.PI / 180; v.push(...ring(n, R * Math.cos(a), R * Math.sin(a))); e.push(...loopEdges(off, n)); }
      for (let m = 0; m < 4; m++) {
        const off = v.length, phi = m * Math.PI / 4;
        for (let k = 0; k < n; k++) { const t = 2 * Math.PI * k / n; v.push({ x: R * Math.cos(t) * Math.sin(phi), y: R * Math.sin(t), z: R * Math.cos(t) * Math.cos(phi) }); }
        e.push(...loopEdges(off, n));
      }
      break;
    }
    case 'tetrahedron':
      v = scaleTo([{ x: 1, y: 1, z: 1 }, { x: -1, y: -1, z: 1 }, { x: -1, y: 1, z: -1 }, { x: 1, y: -1, z: -1 }], d('edge') * Math.sqrt(6) / 4); e = nearestEdges(v); break;
    case 'octahedron':
      v = scaleTo([{ x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }], d('edge') * Math.SQRT2 / 2); e = nearestEdges(v); break;
    case 'icosahedron': case 'dodecahedron': {
      const f = (1 + Math.sqrt(5)) / 2, raw = [];
      const cyc = (a, b, c) => { raw.push({ x: a, y: b, z: c }, { x: b, y: c, z: a }, { x: c, y: a, z: b }); };
      if (o.type === 'icosahedron') { for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) cyc(0, s1, s2 * f); }
      else { for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) raw.push({ x: a, y: b, z: c }); for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) cyc(0, s1 / f, s2 * f); }
      const R = o.type === 'icosahedron' ? d('edge') * Math.sqrt(10 + 2 * Math.sqrt(5)) / 4 : d('edge') * Math.sqrt(3) * (1 + Math.sqrt(5)) / 4;
      v = scaleTo(raw, R); e = nearestEdges(v); break;
    }
    case 'torus': {
      const R = d('radius'), t = d('tube'), n = 40;
      // TorusGeometry three.js лежит в плоскости XY (ось — z)
      for (const rr of [R - t, R + t]) { const off = v.length; for (let k = 0; k < n; k++) { const a = 2 * Math.PI * k / n; v.push({ x: rr * Math.cos(a), y: rr * Math.sin(a), z: 0 }); } e.push(...loopEdges(off, n)); }
      for (let m = 0; m < 8; m++) {
        const off = v.length, a = m * Math.PI / 4;
        for (let k = 0; k < 16; k++) { const b = 2 * Math.PI * k / 16; v.push({ x: (R + t * Math.cos(b)) * Math.cos(a), y: (R + t * Math.cos(b)) * Math.sin(a), z: t * Math.sin(b) }); }
        e.push(...loopEdges(off, 16));
      }
      break;
    }
  }
  return { v: v.map((p) => ({ x: p.x + o.x, y: p.y + o.y, z: p.z + o.z })), e };
}
function surfaceGrid(o) {
  const vals = sliderVals(), names = Object.keys(vals);
  const fn = compileExpr(o.expr || '', names, ['x', 'z']);
  if (!fn) return null;
  const S = state.settings, n = 16, rows = [];
  for (let i = 0; i <= n; i++) {
    const row = [];
    for (let j = 0; j <= n; j++) {
      const x = -S.width / 2 + S.width * i / n, z = -S.depth / 2 + S.depth * j / n;
      let y; try { y = fn(x, z, ...names.map((k) => vals[k])); } catch (e) { y = NaN; }
      row.push(isFinite(y) ? { x, y: Math.max(-S.height, Math.min(S.height, y)), z } : null);
    }
    rows.push(row);
  }
  return rows;
}
function planeQuad(o) {
  const A = pos(o.a), B = pos(o.b), C = pos(o.c);
  const u = { x: B.x - A.x, y: B.y - A.y, z: B.z - A.z }, w = { x: C.x - A.x, y: C.y - A.y, z: C.z - A.z };
  const nrm = { x: u.y * w.z - u.z * w.y, y: u.z * w.x - u.x * w.z, z: u.x * w.y - u.y * w.x };
  const nl = Math.hypot(nrm.x, nrm.y, nrm.z);
  if (nl < 1e-9) return null;
  const ul = Math.hypot(u.x, u.y, u.z), e1 = { x: u.x / ul, y: u.y / ul, z: u.z / ul };
  const n1 = { x: nrm.x / nl, y: nrm.y / nl, z: nrm.z / nl };
  const e2 = { x: n1.y * e1.z - n1.z * e1.y, y: n1.z * e1.x - n1.x * e1.z, z: n1.x * e1.y - n1.y * e1.x };
  const g = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3, z: (A.z + B.z + C.z) / 3 };
  const S = state.settings, h = Math.max(S.width, S.depth) * 0.55;
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => ({ x: g.x + h * (a * e1.x + b * e2.x), y: g.y + h * (a * e1.y + b * e2.y), z: g.z + h * (a * e1.z + b * e2.z) }));
}

function draw3D() {
  layout3D();
  svg.innerHTML = '';
  svg.classList.toggle('sel-mode', tool === 'select');
  const S = state.settings, hw = S.width / 2, hh = S.height / 2, hd = S.depth / 2;
  const line3 = (a, b, attrs, g) => { const p = proj(a), q = proj(b); return el('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, ...attrs }, g); };
  // габарит поля
  const box = el('g', { stroke: 'var(--border-strong)', 'stroke-width': 1, 'stroke-dasharray': '3 4' });
  const corners = []; for (const x of [-hw, hw]) for (const y of [-hh, hh]) for (const z of [-hd, hd]) corners.push({ x, y, z });
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) if ([1, 2, 4].includes(i ^ j)) line3(corners[i], corners[j], {}, box);
  if (S.grid) {
    const g = el('g', { class: 'bd-svg-grid', 'stroke-width': 1 });
    for (let x = Math.ceil(-hw); x <= hw; x++) line3({ x, y: 0, z: -hd }, { x, y: 0, z: hd }, {}, g);
    for (let z = Math.ceil(-hd); z <= hd; z++) line3({ x: -hw, y: 0, z }, { x: hw, y: 0, z }, {}, g);
  }
  if (S.workY && tool !== 'select') {
    const q = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, z]) => proj({ x, y: S.workY, z }));
    el('path', { d: q.map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.y).join(' ') + 'Z', fill: 'var(--accent)', 'fill-opacity': .07, stroke: 'var(--accent)', 'stroke-opacity': .4, 'stroke-dasharray': '4 4' });
  }
  if (S.axes) {
    const g = el('g', { class: 'bd-svg-axis', 'stroke-width': 1.4 });
    const ax = [['x', { x: hw, y: 0, z: 0 }, { x: -hw, y: 0, z: 0 }], ['y', { x: 0, y: hh, z: 0 }, { x: 0, y: -hh, z: 0 }], ['z', { x: 0, y: 0, z: hd }, { x: 0, y: 0, z: -hd }]];
    for (const [n, a, b] of ax) { line3(b, a, {}, g); const p = proj(a); el('text', { x: p.x + 6, y: p.y - 4, class: 'bd-svg-tick', 'font-size': 12 }).textContent = n; }
  }
  // объекты: дальние — раньше (сортировка по глубине центра)
  const items = [];
  const center = (pts) => pts.reduce((s, p) => s + proj(p).d, 0) / pts.length;
  for (const o of state.objs) {
    const sel = o.id === selected, c = ink(o);
    const hl = sel ? { filter: 'drop-shadow(0 0 3px var(--accent))' } : {};
    switch (o.kind) {
      case 'surface': {
        const rows = surfaceGrid(o); if (!rows) break;
        items.push({ d: -1e9, fn: (g) => {
          const col = o.color || '#3b82f6';
          for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < rows[i].length - 1; j++) {
            const q = [rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]];
            if (q.some((p) => !p)) continue;
            const pp = q.map(proj);
            el('path', { d: pp.map((p, k) => (k ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ') + 'Z', fill: col, 'fill-opacity': .12 * (o.opacity ?? .7), stroke: col, 'stroke-opacity': sel ? .9 : .45, 'stroke-width': .8 }, g);
          }
        } });
        break;
      }
      case 'plane': {
        const q = planeQuad(o); if (!q) break;
        items.push({ d: center(q) - 1e6, fn: (g) => { const pp = q.map(proj); el('path', { d: pp.map((p, k) => (k ? 'L' : 'M') + p.x + ' ' + p.y).join(' ') + 'Z', fill: o.color || 'var(--accent)', 'fill-opacity': .14, stroke: sel ? 'var(--accent)' : 'none', 'stroke-width': 2 }, g); } });
        break;
      }
      case 'solid': {
        const m = solidMesh(o);
        items.push({ d: proj(o).d, fn: (g) => {
          const pp = m.v.map(proj), col = o.color || 'var(--text-secondary)';
          const gg = el('g', { stroke: col, 'stroke-width': sel ? 2 : 1.3, 'stroke-opacity': o.wireframe ? 1 : .85, ...hl }, g);
          for (const [i, j] of m.e) el('line', { x1: pp[i].x, y1: pp[i].y, x2: pp[j].x, y2: pp[j].y }, gg);
          const C = proj(o); el('circle', { cx: C.x, cy: C.y, r: 3, fill: col }, g);
        } });
        break;
      }
      case 'polygon': {
        const pts = o.pts.map(pos);
        items.push({ d: center(pts), fn: (g) => { const pp = pts.map(proj); el('path', { d: pp.map((p, k) => (k ? 'L' : 'M') + p.x + ' ' + p.y).join(' ') + 'Z', fill: o.fill ? (o.color || 'var(--accent)') : 'none', 'fill-opacity': .22, stroke: c, 'stroke-width': 2.2, 'stroke-linejoin': 'round', ...hl }, g); } });
        break;
      }
      case 'segment': case 'vector': {
        const A = pos(o.a), B = pos(o.b);
        items.push({ d: center([A, B]) + 0.01, fn: (g) => {
          const a = proj(A), b = proj(B);
          el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: c, 'stroke-width': 2.2, 'stroke-linecap': 'round', ...hl }, g);
          if (o.kind === 'vector') { const ang = Math.atan2(b.y - a.y, b.x - a.x), h = 11, w = .45; el('path', { d: `M${b.x} ${b.y} L${b.x - h * Math.cos(ang - w)} ${b.y - h * Math.sin(ang - w)} L${b.x - h * Math.cos(ang + w)} ${b.y - h * Math.sin(ang + w)} Z`, fill: c }, g); }
        } });
        break;
      }
      case 'point': case 'midpoint': {
        const P = pos(o.id);
        items.push({ d: proj(P).d + 0.02, fn: (g) => {
          const p = proj(P);
          // проекция на пол y = 0 — понять высоту точки
          if (Math.abs(P.y) > 1e-6) { const f = proj({ x: P.x, y: 0, z: P.z }); el('line', { x1: p.x, y1: p.y, x2: f.x, y2: f.y, stroke: 'var(--text-tertiary)', 'stroke-dasharray': '2 3' }, g); el('circle', { cx: f.x, cy: f.y, r: 2, fill: 'var(--text-tertiary)' }, g); }
          if (sel) el('circle', { cx: p.x, cy: p.y, r: 11, fill: 'var(--accent)', opacity: .3 }, g);
          el('circle', { cx: p.x, cy: p.y, r: 5, fill: o.kind === 'midpoint' || o.fixed ? c : 'var(--bg-card)', stroke: c, 'stroke-width': 2.2 }, g);
          if (o.label) el('text', { x: p.x - 9, y: p.y - 9, 'text-anchor': 'end', class: 'bd-svg-label' }, g).textContent = o.caption || o.name;
        } });
        break;
      }
    }
  }
  const layer = el('g', {});
  items.sort((a, b) => a.d - b.d).forEach((it) => it.fn(layer));
  if (pending.length && cursor) {
    const pts = pending.map((id) => proj(pos(id))), c = proj(cursor);
    const d = (tool === 'polygon' ? pts : [pts[pts.length - 1]]).map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.y).join(' ') + ` L${c.x} ${c.y}`;
    el('path', { d, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
    for (const p of pts) el('circle', { cx: p.x, cy: p.y, r: 9, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2 });
  }
  if (!state.objs.length && !pending.length) {
    const t = el('text', { x: view.cx, y: 28, 'text-anchor': 'middle', fill: 'var(--text-tertiary)', 'font-size': 14 });
    t.textContent = 'Тащите пустое место — вращать вид; «Точка» ставит точки на пол';
  }
}

function hitAny3D(px) {
  let best = null, bd = Infinity;
  const consider = (o, dist, lim) => { if (dist < lim && dist < bd) { bd = dist; best = o; } };
  for (const o of state.objs) {
    if (o.kind === 'segment' || o.kind === 'vector') consider(o, distSeg(px, proj(pos(o.a)), proj(pos(o.b))), 7);
    if (o.kind === 'solid') {
      const m = solidMesh(o), pp = m.v.map(proj);
      let dmin = Math.hypot(px.x - proj(o).x, px.y - proj(o).y) - 8;
      for (const [i, j] of m.e) dmin = Math.min(dmin, distSeg(px, pp[i], pp[j]));
      consider(o, dmin, 7);
    }
  }
  if (best) return best;
  const inside = (pts) => { let r = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i].y > px.y) !== (pts[j].y > px.y) && px.x < (pts[j].x - pts[i].x) * (px.y - pts[i].y) / (pts[j].y - pts[i].y) + pts[i].x) r = !r; return r; };
  for (const o of state.objs.slice().reverse()) {
    if (o.kind === 'polygon' && inside(o.pts.map((id) => proj(pos(id))))) return o;
  }
  for (const o of state.objs.slice().reverse()) {
    if (o.kind === 'plane') { const A = proj(pos(o.a)), B = proj(pos(o.b)), C = proj(pos(o.c)); if (inside([A, B, C])) return o; }
  }
  return null;
}

// Нажатие инструментом «Выбор» в 3D: объект — перетаскивание, пусто — вращение вида.
function down3D(e, px) {
  const hit = hitAny(px);
  selected = hit ? hit.id : null;
  svg.setPointerCapture(e.pointerId);
  if (hit) {
    let movers = hit.kind === 'solid' || hit.kind === 'point' ? [hit.id] : [...new Set(collectFree(hit))];
    const grabY = hit.kind === 'solid' ? hit.y : pos(movers[0] || hit.id).y;
    if (movers.length) drag = { px, grab: planeAt(px, grabY), grabY, orig: movers.map((id) => { const o = byId(id); return { id, x: o.x, y: o.y, z: o.z || 0 }; }), moved: false };
  } else {
    orbit = { px, rotA: state.settings.rotA, rotP: state.settings.rotP };
  }
  refresh();
}
function move3D(e, px) {
  const S = state.settings;
  const w = planeAt(px, S.workY);
  $('bdCoords').textContent = w ? `x = ${w.x.toFixed(2)}, z = ${w.z.toFixed(2)} (y = ${num(S.workY)})` : '';
  if (orbit) {
    S.rotA = ((orbit.rotA - (px.x - orbit.px.x) * 0.4) % 360 + 360) % 360;
    S.rotP = Math.max(5, Math.min(175, orbit.rotP - (px.y - orbit.px.y) * 0.4));
    draw();
    return;
  }
  if (drag) {
    if (!drag.moved) { snapshot(); drag.moved = true; }
    let dx = 0, dy = 0, dz = 0;
    if (e.shiftKey) {
      // по вертикали: экранный сдвиг вдоль проекции оси y
      dy = -(px.y - drag.px.y) / (view.s * (cam.u.y || 1e-6));
    } else {
      const cur = planeAt(px, drag.grabY);
      if (!cur || !drag.grab) return;
      dx = cur.x - drag.grab.x; dz = cur.z - drag.grab.z;
    }
    if (S.snap) { const q = (v) => Math.round(v * 2) / 2; dx = q(dx); dy = q(dy); dz = q(dz); }
    const hw = S.width / 2, hh = S.height / 2, hd = S.depth / 2;
    for (const o of drag.orig) {
      dx = Math.max(-hw - o.x, Math.min(hw - o.x, dx));
      dy = Math.max(-hh - o.y, Math.min(hh - o.y, dy));
      dz = Math.max(-hd - o.z, Math.min(hd - o.z, dz));
    }
    for (const o of drag.orig) { const t = byId(o.id); t.x = o.x + dx; t.y = o.y + dy; t.z = o.z + dz; }
    refresh();
    return;
  }
  if (pending.length) {
    const h = hitPoint(px);
    cursor = h ? pos(h.id) : (w ? clamp3(snap3(w)) : null);
    draw();
  }
}
svg.addEventListener('wheel', (e) => {
  if (!is3D()) return;
  e.preventDefault();
  const S = state.settings;
  S.zoom = Math.max(0.4, Math.min(4, S.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
  draw(); save();
}, { passive: false });

function generate3D() {
  const S = state.settings, L = [];
  const N = (id) => (byId(id) || {}).name;
  const of = (k) => state.objs.filter((o) => o.kind === k);
  const measured = state.objs.filter((o) => o.measure);
  L.push('[');
  L.push('description = ' + (measured.length ? '"{info}"' : str(S.description || 'Сцена из конструктора')));
  L.push('');
  L.push(`field width = ${num(S.width)}; field height = ${num(S.height)}; field depth = ${num(S.depth)};`);
  L.push(`camera start rot = (${Math.round(S.rotA)}, ${Math.round(S.rotP)});`);
  if (Math.abs(S.zoom - 1) > 0.05) L.push(`camera start zoom = ${num(S.zoom)};`);
  L.push(`show axes = ${!!S.axes}; show grid = ${!!S.grid};`);
  const section = (title, lines) => { if (lines.length) L.push('', '// ---- ' + title + ' ----', ...lines); };
  section('Параметры', of('slider').flatMap((o) => [
    `float ${o.name} = ${num(o.value)};`,
    `new UI { name = "${o.name}_ui"; type = slider; label = ${str(o.label || o.name)}; variable = ${o.name}; min = ${num(o.min)}; max = ${num(o.max)}; step = ${num(o.step)} }`,
  ]));
  section('Поверхности', of('surface').flatMap((o) => [
    `func ${o.name}(x, z) = ${o.expr || '0'};`,
    `draw Surface { name = "${o.name}_s"; type = parametric; mode = 3d; x = "u"; y = "${o.name}(u, v)"; z = "v"; ` +
      `umin = ${num(-S.width / 2)}; umax = ${num(S.width / 2)}; vmin = ${num(-S.depth / 2)}; vmax = ${num(S.depth / 2)}; grid = 40; opacity = ${num(o.opacity ?? 0.7)}${colorField(o)} }`,
  ]));
  section('Точки', state.objs.filter(isPointKind).map((o) => {
    const lab = o.label ? `; text = true(${str(o.caption || o.name)})` : '';
    if (o.kind === 'midpoint') return `new Point3D { name = "${o.name}"; homothety = ${N(o.b)}; center = ${N(o.a)}; ratio = 0.5${lab}${colorField(o)} }`;
    return `new Point3D { name = "${o.name}"; pos = (${num(o.x)}, ${num(o.y)}, ${num(o.z || 0)})${lab}${o.fixed ? '; dynamic = false' : ''}${colorField(o)} }`;
  }));
  const lines = [];
  for (const o of state.objs) {
    if (o.kind === 'segment') lines.push(`new Line3D { name = "${o.name}"; pos = (${N(o.a)}, ${N(o.b)})${colorField(o)} }`);
    if (o.kind === 'vector') lines.push(`new Line3D { name = "${o.name}"; pos = (${N(o.a)}, ${N(o.b)})${colorField(o)} }`,
      `draw Vector3D { name = "${o.name}_v"; edge = "${o.name}"${colorField(o)} }`);
  }
  section('Рёбра и векторы', lines);
  section('Грани', of('polygon').flatMap((o) => {
    const r = o.pts.map((p, i) => `new Line3D { name = "${o.name}_${i + 1}"; pos = (${N(p)}, ${N(o.pts[(i + 1) % o.pts.length])})${colorField(o)} }`);
    // В 3D elements у Figure3D — вершины (точки), а не отрезки, как в 2D (render-3d.js › fillingObjs).
    r.push(`new Figure3D { name = "${o.name}"; elements = (${o.pts.map(N).join(', ')}) }`);
    if (o.fill) r.push(`draw Filling3D { name = "${o.name}_fill"; figure = "${o.name}"; opacity = 0.25${colorField(o)} }`);
    return r;
  }));
  section('Плоскости', of('plane').map((o) => `draw InfPlane { name = "${o.name}"; points = (${N(o.a)}, ${N(o.b)}, ${N(o.c)}); opacity = 0.2${colorField(o)} }`));
  section('Тела', of('solid').map((o) => {
    const dims = SOLIDS[o.type].dims.map((d) => `${d} = ${num(+(o[d] ?? DIM_DEFAULT[d]))}`).join('; ');
    return `new Primitive { name = "${o.name}"; type = ${o.type}; pos = (${num(o.x)}, ${num(o.y)}, ${num(o.z)}); ${dims}; opacity = ${num(o.opacity ?? 0.6)}${o.wireframe ? '; wireframe = true' : ''}${colorField(o)} }`;
  }));
  if (measured.length) {
    const parts = measured.map((o) => {
      const n = o.name;
      const len = (a, b) => `sqrt((${b}.pos.x - ${a}.pos.x)^2 + (${b}.pos.y - ${a}.pos.y)^2 + (${b}.pos.z - ${a}.pos.z)^2)`;
      switch (o.kind) {
        case 'point': case 'midpoint': return `"**${n}** (" + format(${n}.pos.x, 2) + "; " + format(${n}.pos.y, 2) + "; " + format(${n}.pos.z, 2) + ")"`;
        // у Line3D нет .length — длина по координатам концов
        case 'segment': return `"**${n}** = " + format(${len(N(o.a), N(o.b))}, 2)`;
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

window.mfBuilder = { show() { renderToolbar(); setTool(tool); refresh(true); }, generate, get state() { return state; } };
renderToolbar();
setTool('select');
if (!$('viewBuilder').hidden) window.mfBuilder.show();
