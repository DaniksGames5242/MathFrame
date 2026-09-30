// assets/js/geo/geo-reason.js
// Решение геометрической задачи «по действиям» — как в учебнике.
//
// Идея: численная модель (geo-model.js) уже знает, как выглядит чертёж: какие
// точки лежат на каких прямых, в каком порядке, какие углы между какими лучами.
// Этот модуль по чертежу и условию выписывает все известные школьные факты в виде
// уравнений между величинами (длины отрезков, углы, площади, периметры):
//   • свойства фигуры (противоположные стороны параллелограмма равны и т. д.);
//   • свойства построений (биссектриса делит угол пополам, медиана — сторону);
//   • общие теоремы: сложение отрезков и углов, смежные и вертикальные углы,
//     накрест лежащие и односторонние углы при параллельных, сумма углов
//     треугольника, равнобедренный треугольник, теорема Пифагора, тригонометрия
//     прямоугольного треугольника, теоремы синусов и косинусов, формулы площадей.
// Затем из данных «волной» выводится всё, что выводится: на каждом шаге —
// уравнение, в котором неизвестна ровно одна величина. Для каждой величины
// запоминается самый короткий вывод; в решение попадают только шаги, нужные для
// ответа. Каждое применённое утверждение сверяется с моделью — неверный по
// конфигурации факт (не тот из двух углов) в решение не попадёт.
// Если вывод «в лоб» не дошёл до ответа, пробуется введение неизвестной x
// (задачи на отношения и периметр), а в крайнем случае — метод координат.

import { V2, angleAt } from './geo-model.js';

const EPS = 1e-6;
const FIG_RU = {
  triangle: 'треугольника', parallelogram: 'параллелограмма', rhombus: 'ромба', rectangle: 'прямоугольника',
  square: 'квадрата', trapezoid: 'трапеции', quadrilateral: 'четырёхугольника',
};

/* ================= числа ================= */
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
// Число → { s: строка, exact }: целые, простые дроби, k√m, (k√m)/n, иначе ≈ 2 знака.
export function fmtNum(v) {
  if (!Number.isFinite(v)) return { s: '?', exact: false };
  const neg = v < 0; const a = Math.abs(v);
  const sign = neg ? '−' : '';
  const r = Math.round(a);
  if (Math.abs(a - r) < 1e-9 * Math.max(1, a)) return { s: sign + String(r), exact: true };
  for (let d = 2; d <= 12; d++) {
    const n = Math.round(a * d);
    if (Math.abs(a * d - n) < 1e-9 * Math.max(1, a * d) && gcd(n, d) === 1) {
      // десятичная дробь, если она короткая
      if (d === 2 || d === 4 || d === 5 || d === 10) return { s: sign + String(+a.toFixed(3)).replace('.', ','), exact: true };
      return { s: sign + n + '/' + d, exact: true };
    }
  }
  // k√m / d
  for (let d = 1; d <= 6; d++) {
    const sq = (a * d) * (a * d);
    const rn = Math.round(sq);
    if (rn > 1 && rn < 100000 && Math.abs(sq - rn) < 1e-7 * Math.max(1, sq)) {
      let k = 1, m = rn;
      for (let f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; k *= f; }
      if (m === 1) continue;
      const g = gcd(k, d); const kk = k / g, dd = d / g;
      return { s: sign + (kk === 1 ? '' : kk) + '√' + m + (dd === 1 ? '' : '/' + dd), exact: true };
    }
  }
  return { s: sign + String(+a.toFixed(2)).replace('.', ','), exact: false };
}
const num = v => fmtNum(v).s;
const approxMark = v => (fmtNum(v).exact ? '=' : '≈');

/* ================= разметка ================= */
const I = s => '<i>' + s + '</i>';
const ANG = n => '∠' + I(n);

/* ================= чертёж: прямые, лучи, треугольники ================= */
function buildGeometry(ir, model) {
  const pts = model.pts;
  const names = Object.keys(pts).filter(n => pts[n] && Number.isFinite(pts[n].x));
  const V = ir.figure.vertices;
  const L = model.scale;
  const tol = 1e-6 * L;

  // Отрезки, которые есть на чертеже (или упомянуты в задаче).
  const segs = [];
  const addSeg = (a, b) => { if (a && b && a !== b && pts[a] && pts[b]) segs.push([a, b]); };
  for (let i = 0; i < V.length; i++) addSeg(V[i], V[(i + 1) % V.length]);
  for (const c of ir.constructions) {
    if (['bisector', 'median', 'altitude'].includes(c.kind)) addSeg(c.vertex, c.point);
    if (c.kind === 'intersection') { addSeg(c.lines[0][0], c.lines[0][1]); addSeg(c.lines[1][0], c.lines[1][1]); }
    if (c.kind === 'segment') addSeg(c.seg[0], c.seg[1]);
    if (c.kind === 'bisectorMeet') { addSeg(c.vertices[0], c.point); addSeg(c.vertices[1], c.point); }
  }
  for (const g of ir.given.concat(ir.find)) {
    for (const k of ['seg', 'a', 'b']) if (g[k] && g[k].length === 2) addSeg(g[k][0], g[k][1]);
    if (g.segs) g.segs.forEach(s => addSeg(s[0], s[1]));
  }
  // Прямые: объединяем отрезки, лежащие на одной прямой; на прямую попадают все
  // точки чертежа, которые на ней лежат.
  const lines = [];
  for (const [a, b] of segs) {
    const A = pts[a], B = pts[b];
    const d = V2.unit(V2.sub(B, A));
    const on = names.filter(n => Math.abs(V2.cross(d, V2.sub(pts[n], A))) < tol * 10);
    const key = on.slice().sort().join('');
    let line = lines.find(l => l.key === key);
    if (!line) {
      let ordered = on.slice().sort((p, q) => V2.dot(V2.sub(pts[p], A), d) - V2.dot(V2.sub(pts[q], A), d));
      let dd = d, org = A;
      // Порядок точек — от «более ранней» вершины фигуры: AD, а не DA.
      const rank = n => (V.includes(n) ? V.indexOf(n) : 100);
      if (rank(ordered[ordered.length - 1]) < rank(ordered[0])) { ordered = ordered.reverse(); dd = V2.mul(d, -1); }
      line = { key, id: 'l' + lines.length, pts: ordered, dir: dd, origin: org };
      lines.push(line);
    }
  }
  const tOn = (line, n) => V2.dot(V2.sub(pts[n], line.origin), line.dir);
  const linesThrough = n => lines.filter(l => l.pts.includes(n));
  const lineOf = (a, b) => lines.find(l => l.pts.includes(a) && l.pts.includes(b)) || null;

  // Предпочтение при выборе имени луча/угла: вершины фигуры, потом по алфавиту.
  const pref = n => (V.includes(n) ? V.indexOf(n) : 10 + n.charCodeAt(0));
  // Лучи из каждой точки.
  const rays = {};
  for (const n of names) {
    rays[n] = [];
    for (const l of linesThrough(n)) {
      const t0 = tOn(l, n);
      for (const sgn of [1, -1]) {
        const on = l.pts.filter(m => m !== n && (tOn(l, m) - t0) * sgn > tol);
        if (!on.length) continue;
        on.sort((p, q) => pref(p) - pref(q));
        rays[n].push({ id: n + '>' + l.id + (sgn > 0 ? '+' : '-'), from: n, line: l, sgn, pts: on, rep: on[0], dir: V2.mul(l.dir, sgn) });
      }
    }
  }
  const rayTo = (v, p) => (rays[v] || []).find(r => r.pts.includes(p)) || null;

  // Треугольники: три точки, попарно соединённые отрезками чертежа, не на одной прямой.
  const tris = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) for (let k = j + 1; k < names.length; k++) {
    const a = names[i], b = names[j], c = names[k];
    const lab = lineOf(a, b), lbc = lineOf(b, c), lca = lineOf(c, a);
    if (!lab || !lbc || !lca || lab === lbc || lbc === lca || lab === lca) continue;
    tris.push([a, b, c].sort((p, q) => pref(p) - pref(q)));
  }
  return { pts, names, lines, rays, rayTo, lineOf, linesThrough, tris, pref, L, V };
}

/* ================= величины ================= */
function makeVars(G, ir) {
  const vars = new Map();
  const pts = G.pts;
  // Как называть отрезок: как в условии, иначе — по порядку вершин фигуры.
  const mentioned = new Set();
  for (const g of ir.given.concat(ir.find)) {
    for (const k of ['seg', 'a', 'b']) if (g[k] && g[k].length === 2) mentioned.add(g[k]);
    if (g.segs) g.segs.forEach(s => mentioned.add(s));
  }
  for (const c of ir.constructions) {
    if (c.vertex && c.point) mentioned.add(c.vertex + c.point);
    if (c.target) mentioned.add(c.target);
  }
  const segName = (a, b) => {
    if (mentioned.has(a + b)) return a + b;
    if (mentioned.has(b + a)) return b + a;
    return G.pref(a) <= G.pref(b) ? a + b : b + a;
  };
  const lenKey = (a, b) => 'L:' + [a, b].sort().join('');
  const len = (a, b) => {
    const k = lenKey(a, b);
    if (!vars.has(k)) vars.set(k, { key: k, type: 'len', pts: [a, b], name: segName(a, b), value: V2.dist(pts[a], pts[b]) });
    return k;
  };
  // угол между двумя лучами из v
  const angKeyRays = (r1, r2) => 'A:' + r1.from + '|' + [r1.id, r2.id].sort().join('|');
  const angRays = (r1, r2) => {
    const k = angKeyRays(r1, r2);
    if (!vars.has(k)) {
      const val = Math.acos(Math.max(-1, Math.min(1, V2.dot(r1.dir, r2.dir)))) * 180 / Math.PI;
      const [ra, rb] = G.pref(r1.rep) <= G.pref(r2.rep) ? [r1, r2] : [r2, r1];
      // Угол фигуры при вершине, из которой не выходит других лучей, — просто ∠A.
      const v = r1.from, Vf = G.V, i = Vf.indexOf(v), n = Vf.length;
      const single = i >= 0 && (G.rays[v] || []).length === 2 &&
        [ra.rep, rb.rep].sort().join('') === [Vf[(i - 1 + n) % n], Vf[(i + 1) % n]].sort().join('');
      vars.set(k, { key: k, type: 'ang', v, rays: [r1, r2], name: single ? v : ra.rep + v + rb.rep, value: val });
    }
    return k;
  };
  const ang = (p, v, q) => {
    const r1 = G.rayTo(v, p), r2 = G.rayTo(v, q);
    if (!r1 || !r2 || r1 === r2) return null;
    return angRays(r1, r2);
  };
  const area = poly => {
    const k = 'S:' + poly;
    if (!vars.has(k)) {
      let s = 0; const P = poly.split('').map(n => pts[n]);
      for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a.x * b.y - b.x * a.y; }
      vars.set(k, { key: k, type: 'area', poly, name: poly, value: Math.abs(s / 2) });
    }
    return k;
  };
  const per = poly => {
    const k = 'P:' + poly;
    if (!vars.has(k)) {
      let s = 0; const P = poly.split('').map(n => pts[n]);
      for (let i = 0; i < P.length; i++) s += V2.dist(P[i], P[(i + 1) % P.length]);
      vars.set(k, { key: k, type: 'per', poly, name: poly, value: s });
    }
    return k;
  };
  return { vars, len, ang, angRays, area, per };
}

/* ================= уравнения ================= */
// Линейное: Σ c·x = rhs. Нелинейное: f(values) = 0 с отрисовкой.
function lin(terms, rhs, meta) { return Object.assign({ type: 'lin', terms, rhs }, meta); }
function fn(vars, f, meta) { return Object.assign({ type: 'fn', vars, f }, meta); }

export function solveProblem(ir, model) {
  const G = buildGeometry(ir, model);
  const Q = makeVars(G, ir);
  const eqs = [];
  const V = G.V;
  const fig = ir.figure;
  const unit = ir.unit || '';
  const figRu = FIG_RU[fig.type] || 'фигуры';
  const add = e => { if (e) eqs.push(e); return e; };
  const angV = v => {   // внутренний угол фигуры при вершине v
    const i = V.indexOf(v), n = V.length;
    return Q.ang(V[(i - 1 + n) % n], v, V[(i + 1) % n]);
  };
  const sideKeys = () => V.map((v, i) => Q.len(v, V[(i + 1) % V.length]));

  /* ---- 1. данные ---- */
  const givenKeys = new Set();
  const qKey = q => {
    if (q.kind === 'length') return Q.len(q.seg[0], q.seg[1]);
    if (q.kind === 'angle') return q.angle.length === 3 ? Q.ang(q.angle[0], q.angle[1], q.angle[2]) : angV(q.angle);
    if (q.kind === 'perimeter') return Q.per(q.of || V.join(''));
    if (q.kind === 'area') return Q.area(q.of || V.join(''));
    return null;
  };
  for (const g of ir.given) {
    if (['length', 'angle', 'perimeter', 'area'].includes(g.kind)) {
      const k = qKey(g); if (!k) continue;
      givenKeys.add(k);
      add(lin([[k, 1]], g.value, { kind: 'given', cost: 0 }));
    } else if (g.kind === 'ratio') {
      const a = Q.len(g.segs[0][0], g.segs[0][1]), b = Q.len(g.segs[1][0], g.segs[1][1]);
      add(lin([[a, g.ratio[1]], [b, -g.ratio[0]]], 0, { kind: 'ratio', ratio: g.ratio, a, b, cost: 1 }));
    } else if (g.kind === 'mult') {
      const a = Q.len(g.a[0], g.a[1]), b = Q.len(g.b[0], g.b[1]);
      add(lin([[a, 1], [b, -g.k]], 0, { kind: 'cond', why: 'по условию', cost: 1 }));
    } else if (g.kind === 'diff') {
      const a = Q.len(g.a[0], g.a[1]), b = Q.len(g.b[0], g.b[1]);
      add(lin([[a, 1], [b, -1]], g.value, { kind: 'cond', why: 'по условию', cost: 1 }));
    }
  }

  /* ---- 2. параллельность и перпендикулярность ---- */
  const parallels = [];   // [lineA, lineB, 'AD ∥ BC']
  const lineName = (l, a, b) => Q.vars.get(Q.len(a, b)).name;
  const addPar = (s1, s2, why) => {
    const l1 = G.lineOf(s1[0], s1[1]), l2 = G.lineOf(s2[0], s2[1]);
    if (l1 && l2 && l1 !== l2) parallels.push({ l1, l2, n1: lineName(l1, s1[0], s1[1]), n2: lineName(l2, s2[0], s2[1]), why });
  };
  const t = fig.type;
  const isPar = ['parallelogram', 'rhombus', 'rectangle', 'square'].includes(t);
  if (isPar) {
    addPar(V[0] + V[1], V[2] + V[3], 'противоположные стороны ' + figRu);
    addPar(V[1] + V[2], V[0] + V[3], 'противоположные стороны ' + figRu);
  }
  let trapC = null;
  if (t === 'trapezoid') {
    trapC = model.spec.C;
    addPar(trapC[0] + trapC[3], trapC[1] + trapC[2], 'основания трапеции');
  }

  /* ---- 3. свойства фигуры ---- */
  const S = sideKeys();
  const eqLen = (a, b, why, cost) => add(lin([[a, 1], [b, -1]], 0, { kind: 'eq', why, cost: cost || 1 }));
  const eqAng = (a, b, why, cost) => a && b && a !== b ? add(lin([[a, 1], [b, -1]], 0, { kind: 'eq', why, cost: cost || 1, angEq: true })) : null;
  const setVal = (k, v, why) => k && add(lin([[k, 1]], v, { kind: 'prop', why, cost: 1 }));
  // В равнобедренном треугольнике: ∠при основании = (180° − ∠при вершине) : 2.
  const isoBase = (b1, b2, apexAng, tri) => {
    add(lin([[b1, 2], [apexAng, 1]], 180, { kind: 'isoBase', tri, cost: 1 }));
    add(lin([[b2, 2], [apexAng, 1]], 180, { kind: 'isoBase', tri, cost: 1 }));
  };
  if (isPar) {
    eqLen(S[0], S[2], 'противоположные стороны ' + figRu + ' равны');
    eqLen(S[1], S[3], 'противоположные стороны ' + figRu + ' равны');
    eqAng(angV(V[0]), angV(V[2]), 'противоположные углы ' + figRu + ' равны');
    eqAng(angV(V[1]), angV(V[3]), 'противоположные углы ' + figRu + ' равны');
    for (let i = 0; i < 4; i++) add(lin([[angV(V[i]), 1], [angV(V[(i + 1) % 4]), 1]], 180, { kind: 'sum180', why: 'сумма углов ' + figRu + ', прилежащих к одной стороне, равна 180°', cost: 1 }));
    const per = Q.per(V.join(''));
    add(lin([[per, 1], [S[0], -2], [S[1], -2]], 0, { kind: 'perimeter', why: 'P = 2(a + b)', cost: 1 }));
  }
  if (t === 'rhombus' || t === 'square') for (let i = 1; i < 4; i++) eqLen(S[0], S[i], 'все стороны ' + figRu + ' равны');
  if (t === 'rectangle' || t === 'square') V.forEach(v => setVal(angV(v), 90, 'все углы ' + figRu + ' прямые'));
  if (t === 'triangle') {
    const k = [angV(V[0]), angV(V[1]), angV(V[2])];
    if (fig.rightAngle) setVal(angV(fig.rightAngle), 90, 'по условию угол ' + fig.rightAngle + ' прямой');
    else if (fig.right) setVal(angV(V[2]), 90, 'треугольник прямоугольный');
    if (fig.isosceles || fig.base || fig.isoRight) {
      const base = fig.base || (fig.isoRight ? V.filter(x => x !== (fig.rightAngle || V[2])).join('') : V[0] + V[2]);
      const apex = V.find(x => !base.includes(x));
      eqLen(Q.len(apex, base[0]), Q.len(apex, base[1]), 'боковые стороны равнобедренного треугольника равны');
      eqAng(angV(base[0]), angV(base[1]), 'углы при основании равнобедренного треугольника равны');
      isoBase(angV(base[0]), angV(base[1]), angV(apex), V.join(''));
    }
    if (fig.equilateral) {
      eqLen(S[0], S[1], 'стороны равностороннего треугольника равны'); eqLen(S[1], S[2], 'стороны равностороннего треугольника равны');
      k.forEach(a => setVal(a, 60, 'углы равностороннего треугольника равны 60°'));
    }
    add(lin([[Q.per(V.join('')), 1], [S[0], -1], [S[1], -1], [S[2], -1]], 0, { kind: 'perimeter', why: 'периметр — сумма сторон', cost: 1 }));
  }
  if (t === 'trapezoid') {
    const C = trapC;
    if (fig.isosceles) {
      eqLen(Q.len(C[0], C[1]), Q.len(C[2], C[3]), 'боковые стороны равнобедренной трапеции равны');
      eqAng(angV(C[0]), angV(C[3]), 'углы при основании равнобедренной трапеции равны');
      eqAng(angV(C[1]), angV(C[2]), 'углы при основании равнобедренной трапеции равны');
    }
    if (fig.rightTrap) { setVal(angV(C[0]), 90, 'трапеция прямоугольная'); setVal(angV(C[1]), 90, 'трапеция прямоугольная'); }
    add(lin([[Q.per(V.join('')), 1]].concat(S.map(s => [s, -1])), 0, { kind: 'perimeter', why: 'периметр — сумма сторон', cost: 1 }));
  }
  if (t === 'quadrilateral') add(lin([[Q.per(V.join('')), 1]].concat(S.map(s => [s, -1])), 0, { kind: 'perimeter', why: 'периметр — сумма сторон', cost: 1 }));

  /* ---- 4. построения ---- */
  const bisectors = [];
  for (const c of ir.constructions) {
    if (c.kind === 'bisector' && c.angle && G.pts[c.point]) {
      const [p, v, q] = c.angle.split('');
      const a1 = Q.ang(p, v, c.point), a2 = Q.ang(c.point, v, q), whole = Q.ang(p, v, q);
      const who = Q.vars.get(Q.len(v, c.point)).name;
      if (a1 && a2) {
        eqAng(a1, a2, who + ' — биссектриса', 1);
        if (whole) add(lin([[whole, 1], [a1, -2]], 0, { kind: 'half', why: who + ' — биссектриса угла ' + Q.vars.get(whole).name, cost: 1 }));
        bisectors.push({ v, point: c.point, a1, a2 });
      }
    }
    if (c.kind === 'bisectorMeet') {
      for (const v of c.vertices) {
        const i = V.indexOf(v), n = V.length; const p = V[(i - 1 + n) % n], q = V[(i + 1) % n];
        const a1 = Q.ang(p, v, c.point), a2 = Q.ang(c.point, v, q);
        if (a1 && a2) {
          const who = Q.vars.get(Q.len(v, c.point)).name;
          eqAng(a1, a2, who + ' — биссектриса', 1);
          const whole = Q.ang(p, v, q);
          if (whole) add(lin([[whole, 1], [a1, -2]], 0, { kind: 'half', why: who + ' — биссектриса угла ' + Q.vars.get(whole).name, cost: 1 }));
        }
      }
    }
    if ((c.kind === 'median' || c.kind === 'midpoint') && G.pts[c.point]) {
      const s = c.kind === 'median' ? c.target : c.seg;
      const why = c.kind === 'median' ? Q.vars.get(Q.len(c.vertex, c.point)).name + ' — медиана' : c.point + ' — середина ' + Q.vars.get(Q.len(s[0], s[1])).name;
      eqLen(Q.len(s[0], c.point), Q.len(c.point, s[1]), why);
      add(lin([[Q.len(s[0], s[1]), 1], [Q.len(s[0], c.point), -2]], 0, { kind: 'half', why, cost: 1 }));
    }
    if (c.kind === 'altitude' && G.pts[c.point]) {
      const who = Q.vars.get(Q.len(c.vertex, c.point)).name;
      for (const r of G.rays[c.point] || []) {
        const rv = G.rayTo(c.point, c.vertex);
        if (!rv || r === rv || r.line === rv.line) continue;
        setVal(Q.angRays(rv, r), 90, who + ' — высота');
      }
    }
    if (c.kind === 'intersection' && G.pts[c.point] && isPar && V.length === 4) {
      const [d1, d2] = c.lines;
      const isDiag = s => (s === V[0] + V[2] || s === V[2] + V[0] || s === V[1] + V[3] || s === V[3] + V[1]);
      if (isDiag(d1) && isDiag(d2)) {
        const o = c.point;
        eqLen(Q.len(V[0], o), Q.len(o, V[2]), 'диагонали ' + figRu + ' точкой пересечения делятся пополам');
        eqLen(Q.len(V[1], o), Q.len(o, V[3]), 'диагонали ' + figRu + ' точкой пересечения делятся пополам');
        add(lin([[Q.len(V[0], V[2]), 1], [Q.len(V[0], o), -2]], 0, { kind: 'half', why: 'диагонали точкой пересечения делятся пополам', cost: 1 }));
        add(lin([[Q.len(V[1], V[3]), 1], [Q.len(V[1], o), -2]], 0, { kind: 'half', why: 'диагонали точкой пересечения делятся пополам', cost: 1 }));
        if (t === 'rectangle' || t === 'square') eqLen(Q.len(V[0], V[2]), Q.len(V[1], V[3]), 'диагонали ' + figRu + ' равны');
        if (t === 'rhombus' || t === 'square') {
          setVal(Q.ang(V[0], o, V[1]), 90, 'диагонали ' + figRu + ' перпендикулярны');
          for (let i = 0; i < 4; i++) {
            const v = V[i], p = V[(i + 3) % 4], q = V[(i + 1) % 4];
            eqAng(Q.ang(p, v, o), Q.ang(o, v, q), 'диагонали ромба — биссектрисы его углов');
          }
          const Sr = Q.area(V.join(''));
          add(fn([Sr, Q.len(V[0], V[2]), Q.len(V[1], V[3])], x => x[0] - x[1] * x[2] / 2, {
            kind: 'formula', cost: 2,
          }));
        }
      }
    }
  }

  /* ---- 5. общие теоремы ---- */
  // 5.1 Сложение отрезков на каждой прямой (цепочки до четырёх слагаемых).
  for (const l of G.lines) {
    const P = l.pts;
    const n = P.length;
    if (n < 3) continue;
    for (let i = 0; i < n; i++) for (let k = i + 2; k < n; k++) {
      const inner = P.slice(i + 1, k);
      const m = inner.length;
      for (let mask = 1; mask < (1 << m) && m <= 4; mask++) {
        const cut = inner.filter((_, b) => mask & (1 << b));
        if (cut.length > 3) continue;
        const chain = [P[i]].concat(cut, [P[k]]);
        const terms = [[Q.len(P[i], P[k]), 1]];
        for (let j = 0; j + 1 < chain.length; j++) terms.push([Q.len(chain[j], chain[j + 1]), -1]);
        add(lin(terms, 0, { kind: 'segsum', whole: Q.len(P[i], P[k]), parts: terms.slice(1).map(t => t[0]), cost: 1 }));
      }
    }
  }
  // 5.2 Углы при каждой точке: сложение углов, смежные, вертикальные.
  for (const v of G.names) {
    const R = G.rays[v] || [];
    for (let a = 0; a < R.length; a++) for (let b = a + 1; b < R.length; b++) {
      const ra = R[a], rb = R[b];
      if (ra.line === rb.line) continue;
      // смежные: rb — и оба луча прямой ra.line
      const opp = R.find(r => r.line === ra.line && r !== ra);
      if (opp) add(lin([[Q.angRays(ra, rb), 1], [Q.angRays(opp, rb), 1]], 180, { kind: 'adjacent', cost: 1, why: 'смежные углы' }));
      // вертикальные
      const oppB = R.find(r => r.line === rb.line && r !== rb);
      if (opp && oppB && ra.id < opp.id) eqAng(Q.angRays(ra, rb), Q.angRays(opp, oppB), 'вертикальные углы', 1);
      // сложение: луч rc внутри угла (ra, rb)
      for (const rc of R) {
        if (rc === ra || rc === rb || rc.line === ra.line || rc.line === rb.line) continue;
        const cab = V2.cross(ra.dir, rb.dir), cac = V2.cross(ra.dir, rc.dir), ccb = V2.cross(rc.dir, rb.dir);
        const inside = Math.sign(cac) === Math.sign(cab) && Math.sign(ccb) === Math.sign(cab) && V2.dot(ra.dir, rb.dir) > -1 + 1e-9;
        if (inside && ra.id < rb.id) add(lin([[Q.angRays(ra, rb), 1], [Q.angRays(ra, rc), -1], [Q.angRays(rc, rb), -1]], 0, { kind: 'angsum', cost: 1 }));
      }
    }
  }
  // 5.3 Параллельные и секущая.
  for (const par of parallels) {
    for (const tl of G.lines) {
      if (tl === par.l1 || tl === par.l2) continue;
      const P = tl.pts.find(n => par.l1.pts.includes(n)), Qp = tl.pts.find(n => par.l2.pts.includes(n));
      if (!P || !Qp || P === Qp) continue;
      const rPQ = G.rayTo(P, Qp), rQP = G.rayTo(Qp, P);
      if (!rPQ || !rQP) continue;
      const tName = Q.vars.get(Q.len(P, Qp)).name;
      for (const u of G.rays[P].filter(r => r.line === par.l1)) for (const w of G.rays[Qp].filter(r => r.line === par.l2)) {
        const same = V2.dot(u.dir, w.dir) > 0;
        const a1 = Q.angRays(u, rPQ), a2 = Q.angRays(w, rQP);
        if (!same) eqAng(a1, a2, 'накрест лежащие при ' + par.n1 + ' ∥ ' + par.n2 + ' и секущей ' + tName, 1);
        else add(lin([[a1, 1], [a2, 1]], 180, { kind: 'cointerior', cost: 1, why: 'односторонние углы при ' + par.n1 + ' ∥ ' + par.n2 + ' и секущей ' + tName }));
      }
    }
  }
  // 5.4 Треугольники: сумма углов, Пифагор, синусы/косинусы, площадь.
  const triInfo = [];
  for (const [a, b, c] of G.tris) {
    const A = Q.ang(b, a, c), B = Q.ang(a, b, c), C = Q.ang(a, c, b);
    if (!A || !B || !C) continue;
    const ab = Q.len(a, b), bc = Q.len(b, c), ca = Q.len(c, a);
    const tri = a + b + c;
    triInfo.push({ a, b, c, A, B, C, ab, bc, ca, tri });
    add(lin([[A, 1], [B, 1], [C, 1]], 180, { kind: 'trisum', tri, cost: 1 }));
    // Два угла известны и равны → треугольник равнобедренный (по значениям углов).
    for (const [x, y, sx, sy] of [[A, B, bc, ca], [B, C, ca, ab], [A, C, bc, ab]]) {
      if (Math.abs(Q.vars.get(x).value - Q.vars.get(y).value) < 1e-7) add(lin([[sx, 1], [sy, -1]], 0, { kind: 'isoNum', tri, angs: [x, y], requires: [x, y], cost: 1 }));
    }
    const sides = { [a]: bc, [b]: ca, [c]: ab };   // противолежащие стороны
    const angs = { [a]: A, [b]: B, [c]: C };
    for (const r of [a, b, c]) {
      const val = Q.vars.get(angs[r]).value;
      if (Math.abs(val - 90) > 1e-6) continue;
      const [p, q] = [a, b, c].filter(x => x !== r);
      const hyp = sides[r], l1 = Q.len(r, p), l2 = Q.len(r, q);
      // Пифагор (нужно знать, что угол прямой)
      add(fn([hyp, l1, l2], x => x[0] * x[0] - x[1] * x[1] - x[2] * x[2], { kind: 'pyth', requires: [angs[r]], tri, right: r, cost: 2 }));
      // тригонометрия прямоугольного треугольника
      for (const [leg, opAng, adjAng] of [[l1, angs[q], angs[p]], [l2, angs[p], angs[q]]]) {
        add(fn([leg, hyp, opAng], x => x[0] - x[1] * Math.sin(x[2] * Math.PI / 180), { kind: 'rtrig', fnName: 'sin', requires: [angs[r]], tri, cost: 2 }));
        add(fn([leg, hyp, adjAng], x => x[0] - x[1] * Math.cos(x[2] * Math.PI / 180), { kind: 'rtrig', fnName: 'cos', requires: [angs[r]], tri, cost: 2 }));
      }
      add(fn([l1, l2, angs[q]], x => x[0] - x[1] * Math.tan(x[2] * Math.PI / 180), { kind: 'rtrig', fnName: 'tg', requires: [angs[r]], tri, cost: 2 }));
      // медиана к гипотенузе
      const mid = G.names.find(m => G.pts[m] && V2.dist(G.pts[m], V2.mid(G.pts[p], G.pts[q])) < 1e-6 * G.L && G.lineOf(m, r));
      if (mid && G.lineOf(p, q) && G.lineOf(p, q).pts.includes(mid)) add(lin([[hyp, 1], [Q.len(r, mid), -2]], 0, { kind: 'half', why: 'медиана, проведённая к гипотенузе, равна её половине', cost: 1 }));
      // площадь через катеты
      add(fn([Q.area(tri), l1, l2], x => x[0] - x[1] * x[2] / 2, { kind: 'area_legs', requires: [angs[r]], tri, cost: 2 }));
    }
    // теорема косинусов / синусов
    for (const r of [a, b, c]) {
      const [p, q] = [a, b, c].filter(x => x !== r);
      add(fn([sides[r], Q.len(r, p), Q.len(r, q), angs[r]], x => x[0] * x[0] - x[1] * x[1] - x[2] * x[2] + 2 * x[1] * x[2] * Math.cos(x[3] * Math.PI / 180), { kind: 'cosine', tri, at: r, cost: 4 }));
    }
    for (const [r, s] of [[a, b], [b, c], [a, c]]) {
      add(fn([sides[r], angs[r], sides[s], angs[s]], x => x[0] * Math.sin(x[3] * Math.PI / 180) - x[2] * Math.sin(x[1] * Math.PI / 180), { kind: 'sine', tri, cost: 4 }));
    }
    // площадь: ½·a·b·sin C, ½·основание·высота, Герон
    for (const r of [a, b, c]) {
      const [p, q] = [a, b, c].filter(x => x !== r);
      add(fn([Q.area(tri), Q.len(r, p), Q.len(r, q), angs[r]], x => x[0] - x[1] * x[2] * Math.sin(x[3] * Math.PI / 180) / 2, { kind: 'area_sin', tri, at: r, cost: 3 }));
    }
    add(fn([Q.area(tri), ab, bc, ca], x => { const s = (x[1] + x[2] + x[3]) / 2; return x[0] - Math.sqrt(Math.max(0, s * (s - x[1]) * (s - x[2]) * (s - x[3]))); }, { kind: 'heron', tri, cost: 5 }));
    add(lin([[Q.per(tri), 1], [ab, -1], [bc, -1], [ca, -1]], 0, { kind: 'perimeter', why: 'периметр треугольника ' + tri + ' — сумма сторон', cost: 1 }));
  }
  // площадь через высоты (любая построенная высота к стороне фигуры/треугольника)
  for (const c of ir.constructions) {
    if (c.kind !== 'altitude' || !G.pts[c.point] || !c.target) continue;
    const h = Q.len(c.vertex, c.point), base = Q.len(c.target[0], c.target[1]);
    const tri = [c.vertex, c.target[0], c.target[1]];
    if (new Set(tri).size === 3 && V.length === 3) add(fn([Q.area(V.join('')), base, h], x => x[0] - x[1] * x[2] / 2, { kind: 'area_bh', cost: 2, fig: 'tri' }));
    if (isPar) add(fn([Q.area(V.join('')), base, h], x => x[0] - x[1] * x[2], { kind: 'area_bh', cost: 2, fig: 'par', figRu }));
    if (t === 'trapezoid') {
      const C = trapC; const b1 = Q.len(C[0], C[3]), b2 = Q.len(C[1], C[2]);
      if ([b1, b2].includes(base)) add(fn([Q.area(V.join('')), b1, b2, h], x => x[0] - (x[1] + x[2]) / 2 * x[3], { kind: 'area_trap', cost: 2 }));
    }
  }
  // Две высоты из концов верхнего основания трапеции (или параллелограмма).
  const alts = ir.constructions.filter(c => c.kind === 'altitude' && G.pts[c.point] && c.target);
  for (let i = 0; i < alts.length; i++) for (let j = i + 1; j < alts.length; j++) {
    const h1 = alts[i], h2 = alts[j];
    const same = (h1.target === h2.target || h1.target === h2.target[1] + h2.target[0]);
    if (!same || !G.lineOf(h1.vertex, h2.vertex)) continue;
    const top = G.lineOf(h1.vertex, h2.vertex), bot = G.lineOf(h1.target[0], h1.target[1]);
    if (!parallels.some(p => (p.l1 === top && p.l2 === bot) || (p.l1 === bot && p.l2 === top))) continue;
    const quad = h1.vertex + h2.vertex + h2.point + h1.point;
    eqLen(Q.len(h1.point, h2.point), Q.len(h1.vertex, h2.vertex), I(quad) + ' — прямоугольник');
    eqLen(Q.len(h1.vertex, h1.point), Q.len(h2.vertex, h2.point), I(quad) + ' — прямоугольник');
    if (t === 'trapezoid' && fig.isosceles) {
      const C = trapC;
      const A0 = C[0], D0 = C[3];
      const nearA = V2.dist(G.pts[h1.point], G.pts[A0]) < V2.dist(G.pts[h2.point], G.pts[A0]) ? h1 : h2;
      const nearD = nearA === h1 ? h2 : h1;
      const ah = Q.len(A0, nearA.point), kd = Q.len(nearD.point, D0);
      eqLen(ah, kd, 'прямоугольные треугольники ' + I(A0 + nearA.vertex + nearA.point) + ' и ' + I(D0 + nearD.vertex + nearD.point) + ' равны по гипотенузе и катету');
      add(lin([[ah, 2], [Q.len(C[0], C[3]), -1], [Q.len(C[1], C[2]), 1]], 0, { kind: 'half', why: 'в равнобедренной трапеции проекция боковой стороны на основание равна полуразности оснований', cost: 1 }));
    }
  }
  if (isPar) {
    add(fn([Q.area(V.join('')), S[0], S[3], angV(V[0])], x => x[0] - x[1] * x[2] * Math.sin(x[3] * Math.PI / 180), { kind: 'area_par_sin', cost: 3, figRu }));
  }
  // теорема о биссектрисе треугольника
  if (V.length === 3) for (const b of bisectors) {
    const v = b.v; const [p, q] = V.filter(x => x !== v);
    const K = b.point;
    if (!G.lineOf(p, q) || !G.lineOf(p, q).pts.includes(K)) continue;
    add(fn([Q.len(p, K), Q.len(K, q), Q.len(v, p), Q.len(v, q)], x => x[0] * x[3] - x[1] * x[2], { kind: 'bisector_thm', cost: 3, v, p, q, K }));
  }

  /* ---- 6. равнобедренные треугольники (структурно) ---- */
  addIsoscelesRules(G, Q, eqs, triInfo);

  /* ---- 7. вывод ---- */
  const targets = ir.find.map(f => ({ f, key: f.extreme ? null : qKey(f) })).filter(x => x.key || x.f.extreme);
  // «больший/меньший угол» — все углы фигуры, потом выбираем
  for (const x of targets) if (x.f.extreme) {
    const ks = V.map(angV);
    ks.sort((p, q) => (Q.vars.get(p).value - Q.vars.get(q).value) * (x.f.extreme === 'max' ? -1 : 1));
    x.key = ks[0];
  }
  const state = propagate(Q, eqs, targets.map(x => x.key));
  const allKnown = () => targets.every(x => state.known.has(x.key));
  let method = 'deduction';
  let xSteps = null;
  if (!allKnown()) {
    xSteps = tryVariable(Q, eqs, state, targets.map(x => x.key));
    if (xSteps) { method = 'variable'; propagate(Q, eqs, targets.map(x => x.key), state); }
  }
  const steps = [];
  const answers = [];
  let used = [];
  if (targets.every(x => state.known.has(x.key))) {
    const order = collectSteps(state, targets.map(x => x.key));
    used = order;
    const rendered = renderSteps(order, state, Q, unit, xSteps, targets.map(x => x.key));
    steps.push(...rendered);
    for (const x of targets) answers.push({ f: x.f, key: x.key, name: displayQ(Q.vars.get(x.key)), value: state.known.get(x.key).value, unit: unitFor(Q.vars.get(x.key), unit) });
  } else {
    method = 'coords';
  }
  return { method, steps, answers, targets, vars: Q.vars, G, eqs, state, used };
}

function unitFor(v, unit) {
  if (!v) return '';
  if (v.type === 'ang') return '°';
  if (v.type === 'area') return unit ? unit + '²' : '';
  return unit || '';
}
function displayQ(v) {
  if (!v) return '?';
  if (v.type === 'ang') return ANG(v.name);
  if (v.type === 'area') return I('S') + '<sub>' + v.name + '</sub>';
  if (v.type === 'per') return I('P') + '<sub>' + v.name + '</sub>';
  return I(v.name);
}
function withUnit(s, v, unit) {
  const u = unitFor(v, unit);
  if (!u) return s;
  return u === '°' ? s + '°' : s + ' ' + u;
}

/* ================= равнобедренные треугольники ================= */
// Равенство углов, доказанное «словами» (биссектриса, накрест лежащие, вертикальные,
// свойства фигуры), даёт равнобедренный треугольник — и наоборот. Доказательство
// (цепочка равенств) переносится в текст шага.
function addIsoscelesRules(G, Q, eqs, triInfo) {
  for (let round = 0; round < 3; round++) {
    const angG = eqGraph(eqs.filter(e => e.type === 'lin' && e.kind !== 'given' && !e.requires && e.terms.length === 2 && e.rhs === 0 && e.terms[0][1] === 1 && e.terms[1][1] === -1 && Q.vars.get(e.terms[0][0]).type === 'ang'));
    const lenG = eqGraph(eqs.filter(e => e.type === 'lin' && e.kind !== 'given' && !e.requires && e.terms.length === 2 && e.rhs === 0 && e.terms[0][1] === 1 && e.terms[1][1] === -1 && Q.vars.get(e.terms[0][0]).type === 'len'));
    let added = 0;
    for (const T of triInfo) {
      const verts = [T.a, T.b, T.c];
      const angOf = { [T.a]: T.A, [T.b]: T.B, [T.c]: T.C };
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        const x = verts[i], y = verts[j], z = verts[3 - i - j];
        // углы при x и y равны → xz = yz
        const path = findPath(angG, angOf[x], angOf[y]);
        const sx = Q.len(y, z), sy = Q.len(x, z);   // противолежащие x и y
        if (path && !hasEq(eqs, sx, sy)) {
          eqs.push({ type: 'lin', terms: [[sy, 1], [sx, -1]], rhs: 0, kind: 'iso', cost: 1 + path.length, proof: path, tri: T.tri, apex: z, angs: [angOf[x], angOf[y]], deps: path.map(p => p.eq) });
          added++;
        }
        // стороны zx = zy → углы при x и y равны
        const lp = findPath(lenG, Q.len(z, x), Q.len(z, y));
        if (lp && !hasEq(eqs, angOf[x], angOf[y])) {
          eqs.push({ type: 'lin', terms: [[angOf[x], 1], [angOf[y], -1]], rhs: 0, kind: 'isoAng', cost: 1 + lp.length, proof: lp, tri: T.tri, apex: z, angEq: true, deps: lp.map(p => p.eq) });
          const why = 'треугольник ' + I(T.tri) + ' равнобедренный (' + lp.map(p => I(Q.vars.get(p.from).name) + ' = ' + I(Q.vars.get(p.to).name)).join(', ') + ')';
          eqs.push({ type: 'lin', terms: [[angOf[x], 2], [angOf[z], 1]], rhs: 180, kind: 'isoBase', tri: T.tri, why, cost: 2 + lp.length });
          eqs.push({ type: 'lin', terms: [[angOf[y], 2], [angOf[z], 1]], rhs: 180, kind: 'isoBase', tri: T.tri, why, cost: 2 + lp.length });
          added++;
        }
      }
    }
    if (!added) break;
  }
}
function hasEq(eqs, a, b) {
  return eqs.some(e => e.type === 'lin' && e.terms.length === 2 && e.rhs === 0 && ((e.terms[0][0] === a && e.terms[1][0] === b) || (e.terms[0][0] === b && e.terms[1][0] === a)));
}
function eqGraph(list) {
  const g = new Map();
  const link = (a, b, e) => { if (!g.has(a)) g.set(a, []); g.get(a).push({ to: b, eq: e }); };
  for (const e of list) { link(e.terms[0][0], e.terms[1][0], e); link(e.terms[1][0], e.terms[0][0], e); }
  return g;
}
// Кратчайшая цепочка равенств a = … = b: [{from, to, eq}]
function findPath(g, a, b) {
  if (a === b || !g.has(a)) return null;
  const prev = new Map([[a, null]]);
  const queue = [a];
  while (queue.length) {
    const x = queue.shift();
    if (x === b) break;
    for (const ed of g.get(x) || []) if (!prev.has(ed.to)) { prev.set(ed.to, { from: x, eq: ed.eq }); queue.push(ed.to); }
  }
  if (!prev.has(b)) return null;
  const path = [];
  for (let x = b; prev.get(x); x = prev.get(x).from) path.unshift({ from: prev.get(x).from, to: x, eq: prev.get(x).eq });
  return path.length <= 4 ? path : null;
}

/* ================= распространение ================= */
function propagate(Q, eqs, targets, state) {
  state = state || { known: new Map(), round: 0 };
  const known = state.known;
  const tol = v => 1e-6 * Math.max(1, Math.abs(v));
  for (let round = state.round; round < 40; round++) {
    const cand = new Map();   // key → { value, eq, inputs, anc }
    for (const e of eqs) {
      if (e.requires && !e.requires.every(k => known.has(k) && Math.abs(known.get(k).value - Q.vars.get(k).value) < 1e-6)) continue;
      if (e.deps && e.deps.some(d => d.kind === 'given')) { /* равенства из данных — допустимы */ }
      const ks = e.type === 'lin' ? e.terms.map(t => t[0]) : e.vars;
      const unknown = ks.filter(k => !known.has(k));
      if (new Set(unknown).size !== 1) continue;
      const u = unknown[0];
      let value;
      if (e.type === 'lin') {
        let s = e.rhs, cu = 0;
        for (const [k, c] of e.terms) { if (k === u) cu += c; else s -= c * known.get(k).value; }
        if (Math.abs(cu) < 1e-12) continue;
        value = s / cu;
      } else {
        value = solve1D(x => e.f(e.vars.map(k => (k === u ? x : known.get(k).value))), Q.vars.get(u).value);
        if (value === null) continue;
      }
      // сверка с моделью: неверное по конфигурации уравнение не используем
      if (!(Math.abs(value - Q.vars.get(u).value) < 1e-4 * Math.max(1, Math.abs(value)))) continue;
      const inputs = ks.filter(k => k !== u).concat(e.requires || []);
      const anc = new Set();
      for (const k of inputs) { anc.add(k); for (const a of known.get(k).anc) anc.add(a); }
      const cost = anc.size * 10 + (e.cost || 1);
      const prev = cand.get(u);
      if (!prev || cost < prev.cost) cand.set(u, { value, eq: e, inputs: Array.from(new Set(inputs)), anc, cost, round });
    }
    if (!cand.size) { state.round = round; break; }
    for (const [k, c] of cand) {
      // данные известны сразу, без шага
      known.set(k, c);
    }
    state.round = round + 1;
    if (targets.every(k => known.has(k))) {
      // ещё один круг — вдруг найдётся более короткий вывод того же раунда (не нужно)
      break;
    }
  }
  return state;
}

function solve1D(F, guess) {
  // Ньютон с численной производной от значения по модели; модель задаёт нужный корень.
  let x = guess;
  for (let i = 0; i < 60; i++) {
    const f = F(x);
    if (!Number.isFinite(f)) return null;
    if (Math.abs(f) < 1e-13 * Math.max(1, Math.abs(x) ** 2)) return x;
    const h = 1e-7 * Math.max(1, Math.abs(x));
    const d = (F(x + h) - F(x - h)) / (2 * h);
    if (!Number.isFinite(d) || Math.abs(d) < 1e-14) return null;
    const nx = x - f / d;
    if (Math.abs(nx - x) < 1e-13 * Math.max(1, Math.abs(x))) return nx;
    x = nx;
  }
  return Math.abs(F(x)) < 1e-8 ? x : null;
}

/* ================= неизвестная x ================= */
// Для задач вида «периметр 30, стороны относятся как 2 : 3»: одна величина
// принимается за x (или 2x по отношению), остальные выражаются через x линейно,
// пока одно из уравнений не даст x.
function tryVariable(Q, eqs, state, targets) {
  const known = state.known;
  const linEqs = eqs.filter(e => e.type === 'lin');
  // кандидаты на роль x: величины из отношений / условий, затем любые неизвестные длины
  const cands = [];
  for (const e of linEqs) if ((e.kind === 'ratio' || e.kind === 'cond') ) for (const [k] of e.terms) if (!known.has(k)) cands.push({ k, coef: e.kind === 'ratio' ? (k === e.a ? e.ratio[0] : e.ratio[1]) : 1 });
  for (const tk of targets) if (!known.has(tk)) cands.push({ k: tk, coef: 1 });
  const tried = new Set();
  for (const cand of cands) {
    if (tried.has(cand.k)) continue; tried.add(cand.k);
    // affine: key → { a, b }  (значение = a·x + b)
    const aff = new Map();
    for (const [k, v] of known) aff.set(k, { a: 0, b: v.value });
    aff.set(cand.k, { a: cand.coef, b: 0 });
    const exprs = [{ key: cand.k, eq: null }];
    let solvedX = null, solveEq = null;
    for (let it = 0; it < 30 && solvedX === null; it++) {
      let progress = false;
      for (const e of linEqs) {
        const unknown = e.terms.filter(t => !aff.has(t[0]));
        if (unknown.length === 1) {
          const u = unknown[0][0];
          let a = 0, b = e.rhs, cu = 0;
          for (const [k, c] of e.terms) { if (k === u) { cu += c; continue; } a -= c * aff.get(k).a; b -= c * aff.get(k).b; }
          if (Math.abs(cu) < 1e-12) continue;
          aff.set(u, { a: a / cu, b: b / cu });
          exprs.push({ key: u, eq: e });
          progress = true;
        } else if (unknown.length === 0) {
          let a = 0, b = e.rhs;
          for (const [k, c] of e.terms) { a -= c * aff.get(k).a; b -= c * aff.get(k).b; }
          // уравнение: a·x + b... = 0 → −a·x = b  (Σ c·(a_k x + b_k) = rhs)
          if (Math.abs(a) > 1e-9) { solvedX = -b / a; solveEq = e; break; }
        }
      }
      if (!progress) break;
    }
    if (solvedX === null) continue;
    const xv = solvedX;
    const realOf = k => aff.get(k).a * xv + aff.get(k).b;
    // сверка с моделью
    if (Math.abs(realOf(cand.k) - Q.vars.get(cand.k).value) > 1e-4 * Math.max(1, Q.vars.get(cand.k).value)) continue;
    // Записываем найденное как «известное» с особым шагом
    const step = { kind: 'xvar', cand, exprs: exprs.filter(x => x.eq), aff, x: xv, solveEq };
    for (const ex of exprs) {
      if (!known.has(ex.key)) known.set(ex.key, { value: realOf(ex.key), eq: { kind: 'xval', type: 'x', xstep: step }, inputs: [], anc: new Set(), cost: 1, round: state.round });
    }
    return step;
  }
  return null;
}

/* ================= отбор шагов ================= */
function collectSteps(state, targets) {
  const known = state.known;
  const need = new Set();
  const visit = k => {
    if (need.has(k)) return;
    const c = known.get(k);
    if (!c) return;
    need.add(k);
    for (const i of c.inputs) visit(i);
  };
  targets.forEach(visit);
  const order = Array.from(need).filter(k => known.get(k).eq.kind !== 'given');
  order.sort((a, b) => known.get(a).round - known.get(b).round);
  return order;
}

/* ================= текст шагов ================= */
function renderSteps(order, state, Q, unit, xStep, targets) {
  const known = state.known;
  const isTarget = k => (targets || []).includes(k);
  const out = [];
  const val = k => known.get(k).value;
  const nm = k => displayQ(Q.vars.get(k));
  const vU = (k, v) => withUnit(num(v === undefined ? val(k) : v), Q.vars.get(k), unit);
  let prevKind = null, prevWhy = null;
  let xDone = false;
  // «Слияние» равенств: DF = DC = AB = 3 — если ввод шага сам получен равенством
  // и больше никому не нужен, он растворяется в текущем шаге.
  const usedBy = new Map();
  for (const k of order) for (const i of known.get(k).inputs) usedBy.set(i, (usedBy.get(i) || 0) + 1);
  const merged = new Set();
  for (const k of order) {
    const c = known.get(k);
    const e = c.eq;
    if ((e.kind === 'eq' && e.why && !e.angEq) || e.kind === 'iso') {
      const src = c.inputs[0];
      const sc = known.get(src);
      if (sc && sc.eq.kind === 'eq' && !sc.eq.angEq && usedBy.get(src) === 1 && order.includes(src) && !isTarget(src)) merged.add(src);

    }
  }
  const mergedWhy = src => {
    if (!merged.has(src)) return '';
    const sc = known.get(src);
    return ' (' + nm(src) + ' = ' + nm(sc.inputs[0]) + ': ' + srcReason(sc, Q) + ')';
  };
  for (const k of order) {
    if (merged.has(k)) continue;
    const c = known.get(k);
    const e = c.eq;
    let html = '';
    if (e.kind === 'xval') {
      if (xDone) continue;
      xDone = true;
      html = renderX(e.xstep, Q, unit);
      out.push({ html: italicNames(html), kind: 'xvar' });
      prevKind = 'xvar';
      continue;
    }
    if (e.kind === 'iso') {
      const T = e.tri; const short = prevKind === 'iso';
      const [a1, a2] = e.angs;
      const chain = e.proof;
      const src = c.inputs[0];
      const eqPart = nm(k) + ' = ' + nm(src) + (known.get(src).eq.kind === 'eq' && merged.has(src) ? ' = ' + nm(known.get(src).inputs[0]) : '') + ' = ' + '<b>' + vU(k) + '</b>';
      if (short) {
        const names = [chain[0].from].concat(chain.map(p => p.to)).map(nm);
        html = 'Аналогично ' + names.join(' = ') + ', треугольник ' + I(T) + ' равнобедренный: ' + eqPart + mergedWhy(src) + '.';
      } else {
        const parts = chain.map(p => nm(p.from) + ' = ' + nm(p.to) + ' (' + (p.eq.why || 'по доказанному') + ')');
        html = parts.join(', ') + '. Значит, ' + nm(a1) + ' = ' + nm(a2) + ', и треугольник ' + I(T) + ' равнобедренный с основанием ' + I(baseOf(T, e.apex)) + ': ' + eqPart + mergedWhy(src) + '.';
      }
    } else if (e.kind === 'isoNum') {
      const src = c.inputs.find(x => x !== e.angs[0] && x !== e.angs[1]);
      html = nm(e.angs[0]) + ' = ' + nm(e.angs[1]) + ' = ' + vU(e.angs[0]) + ', поэтому треугольник ' + I(e.tri) + ' равнобедренный: ' + nm(k) + ' = ' + nm(src) + ' = <b>' + vU(k) + '</b>.';
    } else if (e.kind === 'isoAng') {
      const T = e.tri;
      html = 'Треугольник ' + I(T) + ' равнобедренный (' + e.proof.map(p => nm(p.from) + ' = ' + nm(p.to)).join(', ') + '), поэтому углы при основании равны: ' + nm(k) + ' = ' + nm(c.inputs[0]) + ' = <b>' + vU(k) + '</b>.';
    } else if (e.kind === 'eq') {
      const src = c.inputs[0];
      let chain = nm(k) + ' = ' + nm(src);
      let why = e.why;
      if (merged.has(src)) { const sc = known.get(src); chain += ' = ' + nm(sc.inputs[0]); why = srcReason(sc, Q) + '; ' + why; }
      html = chain + ' = <b>' + vU(k) + '</b> (' + why + ').';
    } else if (e.kind === 'prop') {
      // свойства «по определению» (прямые углы прямоугольника, высоты) — не отдельный шаг,
      // кроме случая, когда это и есть ответ
      if (!isTarget(k)) continue;
      html = nm(k) + ' = <b>' + vU(k) + '</b> (' + e.why + ').';
    } else if (e.type === 'lin') {
      html = renderLinear(k, e, known, Q, unit);
      const why = linWhy(e, Q);
      if (why && prevWhy === why) html = 'Аналогично ' + html.slice(why.length + 2);
      prevWhy = why;
    } else {
      html = renderFormula(k, e, known, Q, unit);
    }
    out.push({ html: italicNames(html), kind: e.kind });
    if (e.type !== 'lin' || ['eq', 'iso', 'isoAng', 'prop'].includes(e.kind)) prevWhy = null;
    prevKind = e.kind;
  }
  return out;
}
// Обозначения точек/отрезков в пояснениях (AD ∥ BC, BE — биссектриса) — курсивом,
// как в учебнике; то, что уже внутри <i>, не трогаем.
export function italicNames(html) {
  let depth = 0;
  return html.split(/(<[^>]+>)/).map(part => {
    if (part.startsWith('<')) { if (/^<i>/.test(part)) depth++; else if (/^<\/i>/.test(part)) depth--; return part; }
    if (depth > 0) return part;
    return part.replace(/(^|[^A-Za-z])([A-Z][A-Z0-9]{0,4})(?![A-Za-z])/g, (m, pre, nm) => pre + '<i>' + nm + '</i>');
  }).join('');
}
function srcReason(sc, Q) {
  return sc.eq.why || 'по доказанному';
}
function baseOf(tri, apex) { return tri.split('').filter(x => x !== apex).join(''); }

// Линейное уравнение, решённое относительно k: «EF = AD − AE − DF = 12 − 3 − 3 = 6 см».
function renderLinear(k, e, known, Q, unit) {
  const v = Q.vars.get(k);
  const val = x => known.get(x).value;
  const nm = x => displayQ(Q.vars.get(x));
  let cu = 0; const others = [];
  for (const [x, c] of e.terms) { if (x === k) cu += c; else others.push([x, c]); }
  // k = (rhs − Σ c·x) / cu
  const sym = [], nums = [];
  const isAng = v.type === 'ang';
  const deg = s => (isAng ? s + '°' : s);
  if (e.rhs) { sym.push(deg(num(e.rhs / (cu > 0 ? 1 : -1)))); nums.push(deg(num(e.rhs / (cu > 0 ? 1 : -1)))); }
  for (const [x, c] of others) {
    const cc = -c / (cu > 0 ? 1 : -1);
    const sign = cc >= 0 ? (sym.length ? ' + ' : '') : (sym.length ? ' − ' : '−');
    const mag = Math.abs(cc);
    const coef = mag === 1 ? '' : num(mag) + '·';
    sym.push(sign + coef + nm(x));
    nums.push(sign + coef + deg(num(val(x))));
  }
  const div = Math.abs(cu);
  let symS = sym.join(''), numS = nums.join('');
  if (div !== 1) { symS = (others.length + (e.rhs ? 1 : 0) > 1 ? '(' + symS + ')' : symS) + ' : ' + num(div); numS = (others.length + (e.rhs ? 1 : 0) > 1 ? '(' + numS + ')' : numS) + ' : ' + num(div); }
  const res = '<b>' + withUnit(num(known.get(k).value), v, unit) + '</b>';
  const why = linWhy(e, Q);
  const body = nm(k) + ' = ' + symS + (others.length || div !== 1 ? ' = ' + numS : '') + ' ' + approxMark(known.get(k).value) + ' ' + res;
  return (why ? why + ': ' : '') + body + '.';
}
function linWhy(e, Q) {
  switch (e.kind) {
    case 'segsum': return '';
    case 'trisum': return 'Сумма углов треугольника ' + I(e.tri) + ' равна 180°';
    case 'adjacent': return 'Смежные углы в сумме дают 180°';
    case 'cointerior': return e.why[0].toUpperCase() + e.why.slice(1) + ' в сумме дают 180°';
    case 'sum180': return 'Сумма углов ' + e.why.replace(/^сумма углов /, '').replace(/, равна 180°$/, '') + ' равна 180°';
    case 'angsum': return '';
    case 'half': return e.why[0].toUpperCase() + e.why.slice(1);
    case 'isoBase': return (e.why ? e.why[0].toUpperCase() + e.why.slice(1) + ', ' : 'Треугольник ' + I(e.tri) + ' равнобедренный, ') + 'углы при основании равны, а сумма углов равна 180°';
    case 'perimeter': return 'Периметр — сумма всех сторон';
    case 'ratio': return 'По условию';
    case 'cond': return 'По условию';
    default: return e.why ? e.why[0].toUpperCase() + e.why.slice(1) : '';
  }
}

// Нелинейные формулы.
function renderFormula(k, e, known, Q, unit) {
  const nm = x => displayQ(Q.vars.get(x));
  const vv = x => known.get(x).value;
  const n = x => num(vv(x));
  const ans = '<b>' + withUnit(num(vv(k)), Q.vars.get(k), unit) + '</b>';
  const approx = approxMark(vv(k));
  const V = e.vars;
  switch (e.kind) {
    case 'pyth': {
      const [h, l1, l2] = V;
      const lead = 'Треугольник ' + I(e.tri) + ' прямоугольный (' + ANG(Q.vars.get(e.requires[0]).name) + ' = 90°), по теореме Пифагора ';
      if (k === h) return lead + nm(h) + ' = √(' + nm(l1) + '² + ' + nm(l2) + '²) = √(' + n(l1) + '² + ' + n(l2) + '²) = √' + num(vv(l1) ** 2 + vv(l2) ** 2) + ' ' + approx + ' ' + ans + '.';
      const o = k === l1 ? l2 : l1;
      return lead + nm(k) + ' = √(' + nm(h) + '² − ' + nm(o) + '²) = √(' + n(h) + '² − ' + n(o) + '²) = √' + num(vv(h) ** 2 - vv(o) ** 2) + ' ' + approx + ' ' + ans + '.';
    }
    case 'rtrig': {
      const [leg, hyp, a] = V;
      const lead = 'В прямоугольном треугольнике ' + I(e.tri) + ' ';
      const f = e.fnName;
      if (f === 'tg') {
        if (k === leg) return lead + nm(leg) + ' = ' + nm(hyp) + ' · tg ' + nm(a) + ' = ' + n(hyp) + ' · tg ' + n(a) + '° ' + approx + ' ' + ans + '.';
        if (k === hyp) return lead + nm(hyp) + ' = ' + nm(leg) + ' / tg ' + nm(a) + ' = ' + n(leg) + ' / tg ' + n(a) + '° ' + approx + ' ' + ans + '.';
        return lead + 'tg ' + nm(a) + ' = ' + nm(leg) + ' / ' + nm(hyp) + ' = ' + n(leg) + ' / ' + n(hyp) + ', ' + nm(a) + ' ' + approx + ' ' + ans + '.';
      }
      if (k === leg) return lead + nm(leg) + ' = ' + nm(hyp) + ' · ' + f + ' ' + nm(a) + ' = ' + n(hyp) + ' · ' + f + ' ' + n(a) + '° ' + approx + ' ' + ans + '.';
      if (k === hyp) return lead + nm(hyp) + ' = ' + nm(leg) + ' / ' + f + ' ' + nm(a) + ' = ' + n(leg) + ' / ' + f + ' ' + n(a) + '° ' + approx + ' ' + ans + '.';
      return lead + f + ' ' + nm(a) + ' = ' + nm(leg) + ' / ' + nm(hyp) + ' = ' + n(leg) + ' / ' + n(hyp) + ', откуда ' + nm(a) + ' ' + approx + ' ' + ans + '.';
    }
    case 'cosine': {
      const [s, p, q, a] = V;
      if (k === s) return 'По теореме косинусов в треугольнике ' + I(e.tri) + ': ' + nm(s) + '² = ' + nm(p) + '² + ' + nm(q) + '² − 2·' + nm(p) + '·' + nm(q) + '·cos ' + nm(a) + ' = ' + n(p) + '² + ' + n(q) + '² − 2·' + n(p) + '·' + n(q) + '·cos ' + n(a) + '° = ' + num(vv(s) ** 2) + ', ' + nm(s) + ' ' + approx + ' ' + ans + '.';
      if (k === a) return 'По теореме косинусов в треугольнике ' + I(e.tri) + ': cos ' + nm(a) + ' = (' + nm(p) + '² + ' + nm(q) + '² − ' + nm(s) + '²) / (2·' + nm(p) + '·' + nm(q) + ') = (' + n(p) + '² + ' + n(q) + '² − ' + n(s) + '²) / (2·' + n(p) + '·' + n(q) + ') = ' + num((vv(p) ** 2 + vv(q) ** 2 - vv(s) ** 2) / (2 * vv(p) * vv(q))) + ', ' + nm(a) + ' ' + approx + ' ' + ans + '.';
      return 'По теореме косинусов в треугольнике ' + I(e.tri) + ' из уравнения ' + nm(s) + '² = ' + nm(p) + '² + ' + nm(q) + '² − 2·' + nm(p) + '·' + nm(q) + '·cos ' + nm(a) + ' получаем ' + nm(k) + ' ' + approx + ' ' + ans + '.';
    }
    case 'sine': {
      const [s1, a1, s2, a2] = V;
      const rel = nm(s1) + ' / sin ' + nm(a1) + ' = ' + nm(s2) + ' / sin ' + nm(a2);
      let expr = '';
      if (k === s1) expr = nm(s1) + ' = ' + nm(s2) + ' · sin ' + nm(a1) + ' / sin ' + nm(a2) + ' = ' + n(s2) + ' · sin ' + n(a1) + '° / sin ' + n(a2) + '°';
      else if (k === s2) expr = nm(s2) + ' = ' + nm(s1) + ' · sin ' + nm(a2) + ' / sin ' + nm(a1) + ' = ' + n(s1) + ' · sin ' + n(a2) + '° / sin ' + n(a1) + '°';
      else if (k === a1) expr = 'sin ' + nm(a1) + ' = ' + nm(s1) + ' · sin ' + nm(a2) + ' / ' + nm(s2) + ' = ' + num(vv(s1) * Math.sin(vv(a2) * Math.PI / 180) / vv(s2)) + ', ' + nm(a1);
      else expr = 'sin ' + nm(a2) + ' = ' + nm(s2) + ' · sin ' + nm(a1) + ' / ' + nm(s1) + ' = ' + num(vv(s2) * Math.sin(vv(a1) * Math.PI / 180) / vv(s1)) + ', ' + nm(a2);
      return 'По теореме синусов в треугольнике ' + I(e.tri) + ' ' + rel + ', ' + expr + ' ' + approx + ' ' + ans + '.';
    }
    case 'area_legs': {
      const [S, l1, l2] = V;
      if (k === S) return 'Площадь прямоугольного треугольника равна половине произведения катетов: ' + nm(S) + ' = ½ · ' + nm(l1) + ' · ' + nm(l2) + ' = ½ · ' + n(l1) + ' · ' + n(l2) + ' ' + approx + ' ' + ans + '.';
      const o = k === l1 ? l2 : l1;
      return 'Из формулы площади прямоугольного треугольника ' + nm(S) + ' = ½ · ' + nm(l1) + ' · ' + nm(l2) + ': ' + nm(k) + ' = 2' + nm(S) + ' / ' + nm(o) + ' = 2 · ' + n(S) + ' / ' + n(o) + ' ' + approx + ' ' + ans + '.';
    }
    case 'area_sin': {
      const [S, p, q, a] = V;
      if (k === S) return nm(S) + ' = ½ · ' + nm(p) + ' · ' + nm(q) + ' · sin ' + nm(a) + ' = ½ · ' + n(p) + ' · ' + n(q) + ' · sin ' + n(a) + '° ' + approx + ' ' + ans + '.';
      return 'Из формулы ' + nm(S) + ' = ½ · ' + nm(p) + ' · ' + nm(q) + ' · sin ' + nm(a) + ' находим ' + nm(k) + ' ' + approx + ' ' + ans + '.';
    }
    case 'heron': {
      const [S, a, b, c] = V;
      const p = (vv(a) + vv(b) + vv(c)) / 2;
      if (k === S) return 'По формуле Герона: полупериметр p = (' + n(a) + ' + ' + n(b) + ' + ' + n(c) + ') / 2 = ' + num(p) + ', ' + nm(S) + ' = √(p(p − a)(p − b)(p − c)) = √(' + num(p) + ' · ' + num(p - vv(a)) + ' · ' + num(p - vv(b)) + ' · ' + num(p - vv(c)) + ') ' + approx + ' ' + ans + '.';
      return 'Из формулы Герона находим ' + nm(k) + ' ' + approx + ' ' + ans + '.';
    }
    case 'area_bh': {
      const [S, b, h] = V;
      const half = e.fig === 'tri';
      const f = half ? '½ · ' : '';
      if (k === S) return (half ? 'Площадь треугольника равна половине произведения основания на высоту' : 'Площадь ' + (e.figRu || 'параллелограмма') + ' равна произведению основания на высоту') + ': ' + nm(S) + ' = ' + f + nm(b) + ' · ' + nm(h) + ' = ' + f + n(b) + ' · ' + n(h) + ' ' + approx + ' ' + ans + '.';
      const o = k === b ? h : b;
      return 'Из формулы площади ' + nm(S) + ' = ' + f + nm(b) + ' · ' + nm(h) + ': ' + nm(k) + ' = ' + (half ? '2' : '') + nm(S) + ' / ' + nm(o) + ' = ' + (half ? '2 · ' : '') + n(S) + ' / ' + n(o) + ' ' + approx + ' ' + ans + '.';
    }
    case 'area_trap': {
      const [S, b1, b2, h] = V;
      if (k === S) return 'Площадь трапеции равна произведению полусуммы оснований на высоту: ' + nm(S) + ' = (' + nm(b1) + ' + ' + nm(b2) + ') / 2 · ' + nm(h) + ' = (' + n(b1) + ' + ' + n(b2) + ') / 2 · ' + n(h) + ' ' + approx + ' ' + ans + '.';
      return 'Из формулы площади трапеции ' + nm(S) + ' = (' + nm(b1) + ' + ' + nm(b2) + ') / 2 · ' + nm(h) + ' находим ' + nm(k) + ' ' + approx + ' ' + ans + '.';
    }
    case 'area_par_sin': {
      const [S, a, b, ang] = V;
      if (k === S) return 'Площадь ' + (e.figRu || 'параллелограмма') + ': ' + nm(S) + ' = ' + nm(a) + ' · ' + nm(b) + ' · sin ' + nm(ang) + ' = ' + n(a) + ' · ' + n(b) + ' · sin ' + n(ang) + '° ' + approx + ' ' + ans + '.';
      return 'Из формулы ' + nm(S) + ' = ' + nm(a) + ' · ' + nm(b) + ' · sin ' + nm(ang) + ' находим ' + nm(k) + ' ' + approx + ' ' + ans + '.';
    }
    case 'bisector_thm': {
      const [pk, kq, vp, vq] = V;
      return 'По свойству биссектрисы треугольника ' + nm(pk) + ' : ' + nm(kq) + ' = ' + nm(vp) + ' : ' + nm(vq) + ', откуда ' + nm(k) + ' ' + approx + ' ' + ans + '.';
    }
    case 'formula': {
      const [S, d1, d2] = V;
      if (k === S) return 'Площадь ромба равна половине произведения диагоналей: ' + nm(S) + ' = ' + nm(d1) + ' · ' + nm(d2) + ' / 2 = ' + n(d1) + ' · ' + n(d2) + ' / 2 ' + approx + ' ' + ans + '.';
      return 'Из формулы площади ромба ' + nm(S) + ' = ' + nm(d1) + ' · ' + nm(d2) + ' / 2 находим ' + nm(k) + ' ' + approx + ' ' + ans + '.';
    }
    default:
      return nm(k) + ' ' + approx + ' ' + ans + '.';
  }
}

function renderX(step, Q, unit) {
  const nm = x => displayQ(Q.vars.get(x));
  const c = step.cand;
  const aff = step.aff;
  const affS = k => {
    const { a, b } = aff.get(k);
    const ax = Math.abs(a) < 1e-12 ? '' : (Math.abs(a - 1) < 1e-12 ? 'x' : Math.abs(a + 1) < 1e-12 ? '−x' : num(a) + 'x');
    if (Math.abs(b) < 1e-12) return ax || '0';
    if (!ax) return num(b);
    return ax + (b > 0 ? ' + ' : ' − ') + num(Math.abs(b));
  };
  let html = 'Пусть ' + nm(c.k) + ' = ' + affS(c.k) + '. ';
  const rest = step.exprs.filter(x => x.key !== c.k);
  if (rest.length) {
    html += 'Тогда ' + rest.map(x => nm(x.key) + ' = ' + affS(x.key) + (x.eq.why && x.eq.kind !== 'segsum' ? ' (' + x.eq.why + ')' : x.eq.kind === 'ratio' ? ' (по условию)' : '')).join(', ') + '. ';
  }
  const e = step.solveEq;
  // Уравнение: слагаемые с x — слева, известные числа — справа.
  const xt = e.terms.filter(([k]) => Math.abs(aff.get(k).a) > 1e-12);
  let rhs = e.rhs;
  for (const [k, cc] of e.terms) if (Math.abs(aff.get(k).a) <= 1e-12) rhs -= cc * aff.get(k).b;
  let flip = xt.every(([, cc]) => cc < 0) ? -1 : 1;
  rhs *= flip;
  let a = 0, b = 0;
  const lhs = xt.map(([k, cc0], i) => {
    const cc = cc0 * flip;
    a += cc * aff.get(k).a; b += cc * aff.get(k).b;
    const coef = Math.abs(cc) === 1 ? '' : num(Math.abs(cc)) + '·';
    const inner = affS(k);
    const wrap = coef && /[ +−]/.test(inner.replace(/^−/, '')) ? '(' + inner + ')' : inner;
    return (cc < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : '')) + coef + wrap;
  }).join('');
  const simp = (Math.abs(a - 1) < 1e-12 ? '' : num(a)) + 'x' + (Math.abs(b) > 1e-12 ? (b > 0 ? ' + ' : ' − ') + num(Math.abs(b)) : '');
  const why = e.kind === 'perimeter' ? 'По формуле периметра' : (e.why ? e.why[0].toUpperCase() + e.why.slice(1) : 'Получаем уравнение');
  html += why + ': ' + lhs + ' = ' + num(rhs) + (lhs.replace(/<[^>]+>/g, '') !== simp ? ', ' + simp + ' = ' + num(rhs) : '') + ', откуда <b>x = ' + num(step.x) + '</b>.';
  const vals = step.exprs.map(x => nm(x.key) + ' = ' + withUnit(num(aff.get(x.key).a * step.x + aff.get(x.key).b), Q.vars.get(x.key), unit));
  html += ' Значит, ' + [nm(c.k) + ' = ' + withUnit(num(aff.get(c.k).a * step.x), Q.vars.get(c.k), unit)].concat(vals).join(', ') + '.';
  return html;
}

/* ================= метод координат (запасной путь) ================= */
export function coordinateSolution(ir, model, targets, evalQ) {
  const pts = model.pts;
  const V = ir.figure.vertices;
  const f = v => num(Math.abs(v) < 1e-9 ? 0 : v);
  const steps = [];
  // вершины фигуры и построенные точки
  const list = Object.keys(pts).filter(n => pts[n]);
  steps.push({ html: 'Решим задачу методом координат. Поместим ' + I(V[0]) + ' в начало координат, сторону ' + I(V[0] + V[V.length - 1]) + ' — вдоль оси <i>Ox</i>. По данным задачи координаты точек: ' + list.map(n => I(n) + '(' + f(pts[n].x) + '; ' + f(pts[n].y) + ')').join(', ') + '.', kind: 'coords' });
  const answers = [];
  for (const t of targets) {
    const v = evalQ(model, t);
    let html = '';
    if (t.kind === 'length') {
      const A = pts[t.seg[0]], B = pts[t.seg[1]];
      html = I(t.seg) + ' = √((' + f(B.x) + ' − ' + f(A.x) + ')² + (' + f(B.y) + ' − ' + f(A.y) + ')²) ' + approxMark(v) + ' <b>' + withUnit(num(v), { type: 'len' }, ir.unit) + '</b>.';
      answers.push({ f: t, name: I(t.seg), value: v, unit: ir.unit || '' });
    } else if (t.kind === 'angle') {
      html = 'Угол находим через скалярное произведение векторов: ' + ANG(t.angle) + ' ' + approxMark(v) + ' <b>' + num(v) + '°</b>.';
      answers.push({ f: t, name: ANG(t.angle), value: v, unit: '°' });
    } else if (t.kind === 'area') {
      html = 'Площадь по формуле шнурования (Гаусса): ' + I('S') + ' ' + approxMark(v) + ' <b>' + withUnit(num(v), { type: 'area' }, ir.unit) + '</b>.';
      answers.push({ f: t, name: I('S'), value: v, unit: ir.unit ? ir.unit + '²' : '' });
    } else if (t.kind === 'perimeter') {
      html = 'Периметр — сумма длин сторон: ' + I('P') + ' ' + approxMark(v) + ' <b>' + withUnit(num(v), { type: 'len' }, ir.unit) + '</b>.';
      answers.push({ f: t, name: I('P'), value: v, unit: ir.unit || '' });
    }
    steps.push({ html, kind: 'coords' });
  }
  return { steps, answers };
}

export { displayQ, withUnit, num, I, ANG };
