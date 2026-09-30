// assets/js/geo/geo-gms.js
// Чертёж задачи на языке GMS (компилятор — assets/js/gms-compiler.js).
//
// По численной модели (geo-model.js) и решению (geo-reason.js) строит сцену в
// стиле учебника: фигура — сплошными линиями, построения (биссектрисы, медианы,
// высоты) — пунктиром, равные углы — дугами (1, 2, 3 дуги для разных пар), равные
// отрезки — засечками, прямые углы — квадратиками, данные длины и углы —
// подписями, искомое — цветом и подписью «EF = ?». Под полем — подпись «Рис. 1».

import { V2 } from './geo-model.js';

const ACCENT = '#ec4899';      // искомое (контрастно и на светлой, и на тёмной теме)
const GIVEN = '#3b82f6';       // подписи данных

const fmt = v => String(+v.toFixed(3));
const numRu = v => String(+(+v).toFixed(2)).replace('.', ',');
const q = s => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

export function buildGms(ir, model, solution, opts) {
  opts = opts || {};
  const pts = model.pts;
  const V = ir.figure.vertices;
  const names = Object.keys(pts).filter(n => pts[n] && Number.isFinite(pts[n].x));
  const unit = ir.unit ? ' ' + ir.unit : '';

  // ---- вписываем в поле ----
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of names) { const p = pts[n]; minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
  const bw = Math.max(1e-6, maxX - minX), bh = Math.max(1e-6, maxY - minY);
  const W = 16;
  const H = Math.max(7, Math.min(12, W * (bh / bw) * 1.15 + 2.5));
  const k = Math.min((W - 3.2) / bw, (H - 3) / bh);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const T = p => ({ x: (p.x - cx) * k, y: (p.y - cy) * k });
  const P = {};
  for (const n of names) P[n] = T(pts[n]);
  const centroid = V.reduce((s, n) => V2.add(s, P[n]), { x: 0, y: 0 });
  centroid.x /= V.length; centroid.y /= V.length;

  const out = [];
  const lines = new Map();   // "AB" → имя объекта линии
  const lineName = (a, b) => lines.get(a + b) || lines.get(b + a);
  const ensureLine = (a, b, extra) => {
    const have = lineName(a, b);
    if (have) return have;
    const nm = 'l_' + a + b;
    lines.set(a + b, nm);
    out.push('new Line { name = ' + q(nm) + '; pos = (' + a + ', ' + b + '); interact = false' + (extra || '') + ' }');
    return nm;
  };
  // Невидимая линия-носитель (для дуг и засечек на частях отрезков).
  const helper = (a, b) => {
    const nm = 'h_' + a + b;
    if (!lines.has('h:' + a + b)) {
      lines.set('h:' + a + b, nm);
      out.push('new Line { name = ' + q(nm) + '; pos = (' + a + ', ' + b + '); interact = false; color = "transparent"; layer = 1 }');
    }
    return nm;
  };

  // ---- точки: добавляются в конце, когда известны все линии (подписи — в свободную сторону) ----

  // ---- фигура ----
  for (let i = 0; i < V.length; i++) ensureLine(V[i], V[(i + 1) % V.length]);

  // ---- построения ----
  const dashed = [];
  const addDashed = (a, b) => {
    if (!pts[a] || !pts[b] || lineName(a, b)) return;
    const nm = 'd_' + a + b;
    lines.set(a + b, nm);
    out.push('new Line { name = ' + q(nm) + '; pos = (' + a + ', ' + b + '); interact = false; active = false }');
    out.push('draw Punctir { name = ' + q('pd_' + a + b) + '; edge = ' + q(nm) + ' }');
    dashed.push(a + b);
  };
  const consText = [];   // [вид, обозначение]
  let angleCount = 0;
  const arcs = [];
  for (const c of ir.constructions) {
    if (!pts[c.point] && c.kind !== 'segment') continue;
    if (c.kind === 'bisector' || c.kind === 'bisectorMeet') {
      const verts = c.kind === 'bisector' ? [c.vertex] : c.vertices;
      for (const v of verts) {
        addDashed(v, c.point);
        let ang = c.angle;
        if (!ang || c.kind === 'bisectorMeet') {
          const i = V.indexOf(v), n = V.length;
          ang = V[(i - 1 + n) % n] + v + V[(i + 1) % n];
        }
        angleCount = Math.min(3, angleCount + 1);
        arcs.push({ v, a: ang[0], b: c.point, count: angleCount });
        arcs.push({ v, a: c.point, b: ang[2], count: angleCount });
        consText.push(['bis', v + c.point]);
      }
      // Продолжение стороны, если точка упала на продолжение.
      if (c.target && model.info[c.point] && (model.info[c.point].t < -1e-6 || model.info[c.point].t > 1 + 1e-6)) {
        const [x, y] = model.info[c.point].t < 0 ? [c.target[0], c.point] : [c.target[1], c.point];
        addDashed(x, y);
      }
    } else if (c.kind === 'median') {
      addDashed(c.vertex, c.point);
      consText.push(['med', c.vertex + c.point]);
    } else if (c.kind === 'altitude') {
      addDashed(c.vertex, c.point);
      const tgt = c.target;
      if (model.info[c.point] && (model.info[c.point].t < -1e-6 || model.info[c.point].t > 1 + 1e-6)) {
        addDashed(model.info[c.point].t < 0 ? tgt[0] : tgt[1], c.point);
      }
      // прямой угол у основания высоты
      const other = [tgt[0], tgt[1]].find(x => x !== c.point && V2.dist(P[x], P[c.point]) > 1e-6);
      if (other) arcs.push({ v: c.point, a: c.vertex, b: other, count: 1, right: true });
      consText.push(['alt', c.vertex + c.point]);
    } else if (c.kind === 'intersection') {
      for (const s of c.lines) if (!lineName(s[0], s[1])) ensureLine(s[0], s[1]);
    } else if (c.kind === 'segment') {
      ensureLine(c.seg[0], c.seg[1]);
    }
  }
  // Отрезки, упомянутые в условии и не лежащие на уже нарисованных прямых (диагонали и т. п.)
  const onDrawn = (a, b) => {
    for (const key of lines.keys()) {
      if (key.startsWith('h:')) continue;
      const x = key[0], y = key[1];
      if (!pts[x] || !pts[y]) continue;
      const d = V2.unit(V2.sub(pts[y], pts[x]));
      if (Math.abs(V2.cross(d, V2.sub(pts[a], pts[x]))) < 1e-6 * model.scale && Math.abs(V2.cross(d, V2.sub(pts[b], pts[x]))) < 1e-6 * model.scale) return true;
    }
    return false;
  };
  for (const g of ir.given.concat(ir.find)) {
    for (const key of ['seg', 'a', 'b']) {
      const s = g[key];
      if (s && s.length === 2 && pts[s[0]] && pts[s[1]] && !onDrawn(s[0], s[1])) ensureLine(s[0], s[1]);
    }
  }

  // ---- прямые углы фигуры ----
  const rightAt = [];
  const figAngle = v => { const i = V.indexOf(v), n = V.length; return [V[(i - 1 + n) % n], V[(i + 1) % n]]; };
  const t = ir.figure.type;
  if (t === 'rectangle' || t === 'square') V.forEach(v => rightAt.push(v));
  if (ir.figure.rightAngle) rightAt.push(ir.figure.rightAngle);
  if (t === 'trapezoid' && ir.figure.rightTrap) rightAt.push(model.spec.C[0], model.spec.C[1]);
  for (const v of rightAt) { const [a, b] = figAngle(v); arcs.push({ v, a, b, count: 1, right: true }); }

  // ---- данные углы ----
  const angleLabels = [];
  for (const g of ir.given) {
    if (g.kind !== 'angle') continue;
    let a, v, b;
    if (g.angle.length === 3) [a, v, b] = g.angle.split('');
    else { v = g.angle; [a, b] = figAngle(v); }
    if (!P[a] || !P[v] || !P[b]) continue;
    if (Math.abs(g.value - 90) < 1e-9) { arcs.push({ v, a, b, count: 1, right: true }); continue; }
    if (!arcs.some(x => x.v === v && ((x.a === a && x.b === b) || (x.a === b && x.b === a)))) arcs.push({ v, a, b, count: 1, given: true });
    const u1 = V2.unit(V2.sub(P[a], P[v])), u2 = V2.unit(V2.sub(P[b], P[v]));
    const bis = V2.unit(V2.add(u1, u2));
    const pos = V2.add(P[v], V2.mul(bis, 1.55));
    angleLabels.push({ pos, text: numRu(g.value) + '°' });
  }

  // ---- дуги ----
  let ai = 0;
  for (const a of arcs) {
    if (!P[a.a] || !P[a.b]) continue;
    const l1 = helper(a.v, a.a), l2 = helper(a.v, a.b);
    const an = 'ang' + (ai++);
    out.push('new Angle { name = ' + q(an) + '; lines = (' + l1 + ', ' + l2 + ') }');
    out.push('draw Angle { name = ' + q('d' + an) + '; angle = ' + q(an) + '; measure = false; count = ' + (a.count || 1) + '; radius = ' + (a.right ? 0.55 : 0.75 + 0.12 * ((a.count || 1) - 1)) + (a.given ? '; arccolor = ' + GIVEN : '') + ' }');
  }

  // ---- равные отрезки (засечки) ----
  const groups = equalityGroups(ir, model, solution);
  let type = 1;
  const eqCaption = [];
  for (const gr of groups) {
    const edges = gr.segs.map(s => lineName(s[0], s[1]) && isWholeLine(lineName(s[0], s[1]), s) ? lineName(s[0], s[1]) : helper(s[0], s[1]));
    out.push('draw EquallySing { name = ' + q('eq' + type) + '; edges = (' + edges.join(', ') + '); type = ' + type + ' }');
    eqCaption.push(gr.segs.join(' = ') + (gr.value !== undefined ? ' = ' + numRu(gr.value) + unit : ''));
    type++;
    if (type > 4) break;
  }
  function isWholeLine(nm, s) { return nm === 'l_' + s || nm === 'l_' + s[1] + s[0] || nm === 'd_' + s || nm === 'd_' + s[1] + s[0]; }

  // ---- подписи данных длин ----
  const labelled = new Set();
  // Сколько точек чертежа лежит внутри отрезка (тогда подпись — дальше, как размерная).
  const inner = s => names.filter(n => n !== s[0] && n !== s[1] && (() => {
    const A = P[s[0]], B = P[s[1]], X = P[n];
    const d = V2.sub(B, A), L = V2.len(d);
    if (Math.abs(V2.cross(d, V2.sub(X, A))) / L > 1e-3) return false;
    const t = V2.dot(V2.sub(X, A), d) / (L * L);
    return t > 1e-3 && t < 1 - 1e-3;
  })()).length;
  const segLabel = (s, text, color, inward) => {
    const A = P[s[0]], B = P[s[1]];
    if (!A || !B) return;
    const m = V2.mid(A, B);
    let nrm = V2.unit({ x: -(B.y - A.y), y: B.x - A.x });
    if (V2.dot(nrm, V2.sub(m, centroid)) < 0) nrm = V2.mul(nrm, -1);
    if (inward) nrm = V2.mul(nrm, -1);
    const off = inward ? 0.6 : (inner(s) ? 1.35 : 0.7);
    const pos = V2.add(m, V2.mul(nrm, off));
    out.push('draw Text { name = ' + q('t' + (labelled.size)) + '; pos = (' + fmt(pos.x) + ', ' + fmt(pos.y) + '); text = ' + q(text) + '; size = 0.9' + (color ? '; color = ' + color : '') + ' }');
    labelled.add(s);
  };
  for (const g of ir.given) {
    if (g.kind === 'length' && !g.assumed) segLabel(g.seg, numRu(g.value) + unit, GIVEN);
  }
  angleLabels.forEach((l, i) => out.push('draw Text { name = ' + q('ta' + i) + '; pos = (' + fmt(l.pos.x) + ', ' + fmt(l.pos.y) + '); text = ' + q(l.text) + '; size = 0.85; color = ' + GIVEN + ' }'));

  // ---- искомое ----
  const findCaption = [];
  for (const f of ir.find) {
    if (f.kind === 'length' && P[f.seg[0]] && P[f.seg[1]]) {
      out.push('new Line { name = ' + q('f_' + f.seg) + '; pos = (' + f.seg[0] + ', ' + f.seg[1] + '); interact = false; color = ' + ACCENT + '; thickness = 4.5; layer = 30 }');
      const fl = labelled.has(f.seg) ? null : f.seg;
      if (fl) segLabel(f.seg, f.seg + ' = ?', ACCENT, true);
      findCaption.push(f.seg);
    } else if (f.kind === 'angle') {
      let a, v, b;
      if (f.angle.length === 3) [a, v, b] = f.angle.split(''); else { v = f.angle; [a, b] = figAngle(v); }
      if (!P[a] || !P[v] || !P[b]) continue;
      const l1 = helper(v, a), l2 = helper(v, b);
      const an = 'angF' + (ai++);
      out.push('new Angle { name = ' + q(an) + '; lines = (' + l1 + ', ' + l2 + ') }');
      out.push('draw Angle { name = ' + q('d' + an) + '; angle = ' + q(an) + '; measure = false; radius = 1.0; arccolor = ' + ACCENT + '; layer = 6 }');
      const u1 = V2.unit(V2.sub(P[a], P[v])), u2 = V2.unit(V2.sub(P[b], P[v]));
      const pos = V2.add(P[v], V2.mul(V2.unit(V2.add(u1, u2)), 1.75));
      out.push('draw Text { name = ' + q('tf' + ai) + '; pos = (' + fmt(pos.x) + ', ' + fmt(pos.y) + '); text = "?"; size = 1; color = ' + ACCENT + ' }');
      findCaption.push('∠' + f.angle);
    } else if (f.kind === 'area' || f.kind === 'perimeter') {
      const poly = (f.of || V.join('')).split('').filter(n => P[n]);
      if (f.kind === 'area' && poly.length >= 3) {
        const fn = 'fig_' + poly.join('');
        const edges = [];
        for (let i = 0; i < poly.length; i++) edges.push(helper(poly[i], poly[(i + 1) % poly.length]));
        out.push('new Figure { name = ' + q(fn) + '; elements = (' + edges.join(', ') + '); interact = false }');
        out.push('draw Filling { name = ' + q('fill_' + poly.join('')) + '; figure = ' + q(fn) + '; color = ' + ACCENT + '; opacity = 0.16; layer = 2 }');
      }
      if (f.kind === 'area' && poly.length >= 3) {
        const c0 = poly.reduce((acc, n) => V2.add(acc, P[n]), { x: 0, y: 0 });
        out.push('draw Text { name = ' + q('tS' + ai++) + '; pos = (' + fmt(c0.x / poly.length) + ', ' + fmt(c0.y / poly.length) + '); text = "S = ?"; size = 1; color = ' + ACCENT + ' }');
      }
      findCaption.push((f.kind === 'area' ? 'S' : 'P') + (f.of ? ' ' + f.of : ''));
    }
  }

  // ---- точки ----
  const pointsOut = [];
  for (const n of names) {
    const dir = freeDirection(n);
    pointsOut.push('new Point { name = ' + q(n) + '; pos = (' + fmt(P[n].x) + ', ' + fmt(P[n].y) + '); text = true(' + q(n) + '); textDir = (' + fmt(dir.x) + ', ' + fmt(dir.y) + '); dynamic = false; collision = false; interact = false }');
  }
  // Направление подписи: середина самого широкого свободного сектора между
  // отрезками, выходящими из точки.
  function freeDirection(n) {
    const angs = [];
    for (const key of lines.keys()) {
      const s2 = key.startsWith('h:') ? null : key;
      if (!s2) continue;
      const x = s2[0], y = s2[1];
      if (!P[x] || !P[y]) continue;
      const A = P[x], B = P[y], X = P[n];
      const d = V2.sub(B, A), L2 = V2.dot(d, d);
      if (L2 < 1e-12) continue;
      if (Math.abs(V2.cross(d, V2.sub(X, A))) / Math.sqrt(L2) > 1e-3) continue;
      const tt = V2.dot(V2.sub(X, A), d) / L2;
      if (tt < -1e-3 || tt > 1 + 1e-3) continue;
      if (tt > 1e-3) angs.push(Math.atan2(A.y - X.y, A.x - X.x));
      if (tt < 1 - 1e-3) angs.push(Math.atan2(B.y - X.y, B.x - X.x));
    }
    if (!angs.length) { const d = V2.unit(V2.sub(P[n], centroid)); return V2.len(d) ? d : { x: -0.7, y: 0.7 }; }
    angs.sort((a, b) => a - b);
    let best = -1, at = 0;
    for (let i = 0; i < angs.length; i++) {
      const a1 = angs[i], a2 = i + 1 < angs.length ? angs[i + 1] : angs[0] + 2 * Math.PI;
      if (a2 - a1 > best) { best = a2 - a1; at = (a1 + a2) / 2; }
    }
    // при одном отрезке «свободна» вся окружность — ставим напротив него
    return { x: Math.cos(at), y: Math.sin(at) };
  }

  // ---- подпись ----
  const cap = [];
  const KIND = { bis: ['биссектриса', 'биссектрисы'], med: ['медиана', 'медианы'], alt: ['высота', 'высоты'] };
  const byKind = [];
  for (const kd of ['bis', 'med', 'alt']) {
    const list = consText.filter(x => x[0] === kd).map(x => x[1]);
    if (list.length) byKind.push(KIND[kd][list.length > 1 ? 1 : 0] + ' ' + (list.length > 1 ? list.slice(0, -1).join(', ') + ' и ' + list[list.length - 1] : list[0]));
  }
  if (byKind.length) cap.push(capitalize(byKind.join(', ')));
  if (eqCaption.length) cap.push('засечками отмечены равные отрезки ' + eqCaption.join('; '));
  if (opts.assumedText) cap.push(opts.assumedText);
  const description = '**Рис. 1.** ' + (cap.length ? cap.join('; ') : 'Чертёж по условию задачи') + '.';

  const head = [
    '[',
    'description = ' + q(description),
    'theme = ' + (opts.theme === 'dark' ? 'dark' : 'light'),
    'field width = ' + fmt(W) + ';',
    'field height = ' + fmt(H) + ';',
    'camera type = fixed;',
    '',
  ];
  return head.concat(out, pointsOut, [']']).join('\n');
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

// Группы равных отрезков для засечек: равенства, использованные в решении, и
// равные данные длины, связанные с ними.
function equalityGroups(ir, model, solution) {
  const parent = new Map();
  const find = x => { while (parent.get(x) !== x) x = parent.get(x); return x; };
  const add = x => { if (!parent.has(x)) parent.set(x, x); };
  const unite = (a, b) => { add(a); add(b); parent.set(find(a), find(b)); };
  const vars = solution && solution.vars;
  const known = solution && solution.state && solution.state.known;
  const segOf = key => { const v = vars.get(key); return v && v.type === 'len' ? v.name : null; };
  if (known && solution.used && solution.used.length) {
    for (const k of solution.used) {
      const c = known.get(k);
      const e = c.eq;
      if (!e || e.type !== 'lin' || !(e.kind === 'eq' || e.kind === 'iso') || e.angEq) continue;
      const a = segOf(k), b = segOf(c.inputs[0]);
      if (a && b) unite(a, b);
    }
  }
  // равные данные длины (AB = CD = 5 по условию)
  const byVal = new Map();
  for (const g of ir.given) if (g.kind === 'length' && !g.assumed) {
    const key = String(+g.value.toFixed(9));
    if (!byVal.has(key)) byVal.set(key, []);
    byVal.get(key).push(g.seg);
  }
  for (const list of byVal.values()) for (let i = 1; i < list.length; i++) unite(list[0], list[i]);
  // значения
  const groups = new Map();
  for (const x of parent.keys()) {
    const r = find(x);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(x);
  }
  let list = Array.from(groups.values()).filter(g => g.length >= 2);
  // объединяем группы с одинаковым известным значением
  const valOf = seg => {
    if (!known) return undefined;
    for (const [k, c] of known) { const v = vars.get(k); if (v && v.type === 'len' && v.name === seg) return c.value; }
    const g = ir.given.find(x => x.kind === 'length' && (x.seg === seg || x.seg === seg[1] + seg[0]));
    if (g) return g.value;
    return undefined;
  };
  const merged = [];
  for (const g of list) {
    const v = valOf(g[0]);
    const same = merged.find(m => m.value !== undefined && v !== undefined && Math.abs(m.value - v) < 1e-9);
    if (same) same.segs.push(...g); else merged.push({ segs: g.slice(), value: v });
  }
  // упорядочиваем отрезки по порядку появления вершин
  const V = ir.figure.vertices;
  const rank = s => (V.includes(s[0]) ? V.indexOf(s[0]) : 9) * 10 + (V.includes(s[1]) ? V.indexOf(s[1]) : 9);
  merged.forEach(m => m.segs.sort((a, b) => rank(a) - rank(b)));
  return merged;
}

// Эскиз от нейросети ({ points, segments, dashed, circles, highlight }) → GMS.
// Используется, когда задачу решает нейросеть (окружности, ГМТ и т. п.).
export function sketchToGms(sk, opts) {
  opts = opts || {};
  const P0 = {};
  for (const [n, v] of Object.entries((sk && sk.points) || {})) {
    if (/^[A-Za-z][A-Za-z0-9_']{0,3}$/.test(n) && Array.isArray(v) && v.length >= 2 && v.every(Number.isFinite)) P0[n.replace(/'/g, '_')] = { x: +v[0], y: +v[1] };
  }
  const names = Object.keys(P0);
  if (names.length < 2) return '';
  const circles = ((sk && sk.circles) || []).map(c => {
    const ctr = typeof c.center === 'string' ? P0[c.center] : (Array.isArray(c.center) ? { x: +c.center[0], y: +c.center[1] } : null);
    return ctr && Number.isFinite(+c.radius) && +c.radius > 0 ? { c: ctr, r: +c.radius, name: typeof c.center === 'string' ? c.center : null } : null;
  }).filter(Boolean);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const ext = (x, y) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); };
  names.forEach(n => ext(P0[n].x, P0[n].y));
  circles.forEach(c => { ext(c.c.x - c.r, c.c.y - c.r); ext(c.c.x + c.r, c.c.y + c.r); });
  const bw = Math.max(1e-6, maxX - minX), bh = Math.max(1e-6, maxY - minY);
  const W = 16, H = Math.max(7, Math.min(12, W * bh / bw * 1.1 + 2));
  const k = Math.min((W - 2.5) / bw, (H - 2.5) / bh);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const T = p => ({ x: (p.x - cx) * k, y: (p.y - cy) * k });
  const out = [];
  const seg = (list, extra, pre) => (list || []).forEach((s, i) => {
    if (!Array.isArray(s) || !P0[s[0]] || !P0[s[1]]) return;
    const a = s[0].replace(/'/g, '_'), b = s[1].replace(/'/g, '_');
    const nm = pre + i;
    if (pre === 'd') {
      out.push('new Line { name = ' + q(nm) + '; pos = (' + a + ', ' + b + '); interact = false; active = false }');
      out.push('draw Punctir { name = ' + q('p' + nm) + '; edge = ' + q(nm) + ' }');
    } else out.push('new Line { name = ' + q(nm) + '; pos = (' + a + ', ' + b + '); interact = false' + extra + ' }');
  });
  seg(sk.segments, '', 's');
  seg(sk.dashed, '', 'd');
  seg(sk.highlight, '; color = ' + ACCENT + '; thickness = 4.5; layer = 30', 'f');
  circles.forEach((c, i) => {
    const t = T(c.c);
    if (!c.name) out.push('new Point { name = ' + q('oc' + i) + '; pos = (' + fmt(t.x) + ', ' + fmt(t.y) + '); active = false; dynamic = false }');
    out.push('new Circle { name = ' + q('c' + i) + '; center = ' + (c.name ? c.name.replace(/'/g, '_') : 'oc' + i) + '; radius = ' + fmt(c.r * k) + ' }');
  });
  const pts = names.map(n => { const t = T(P0[n]); return 'new Point { name = ' + q(n) + '; pos = (' + fmt(t.x) + ', ' + fmt(t.y) + '); text = true(' + q(n.replace(/_/g, '′')) + '); dynamic = false; collision = false; interact = false }'; });
  return ['[', 'description = ' + q('**Рис. 1.** Эскиз чертежа (построен по решению нейросети, пропорции условные).'), 'theme = ' + (opts.theme === 'dark' ? 'dark' : 'light'), 'field width = ' + fmt(W) + ';', 'field height = ' + fmt(H) + ';', 'camera type = fixed;', '']
    .concat(pts, out, [']']).join('\n');
}
