// assets/js/geo/geo-model.js
// Численная модель задачи: по условию (IR из geo-parse.js) подбирает координаты
// всех точек так, чтобы выполнялись все данные. Фигура задаётся несколькими
// параметрами (длины/координаты); данные и свойства фигуры — это «невязки»,
// которые обнуляются методом Левенберга — Марквардта.
//
// Если данных не хватает, чтобы фигура была определена однозначно, недостающее
// берётся «средним»: решение подтягивается к аккуратной типовой фигуре нужного
// масштаба (параллелограмм с углом 60°, трапеция с высотой в полбазы и т. д.).
// Для каждого искомого значения отдельно проверяется, определено ли оно данными
// (градиент искомого лежит в линейной оболочке градиентов невязок) — чтобы
// честно сказать «ответ зависит от выбора …», если это так.

import { trapBases } from './geo-parse.js';

export const V2 = {
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  mul: (a, k) => ({ x: a.x * k, y: a.y * k }),
  dot: (a, b) => a.x * b.x + a.y * b.y,
  cross: (a, b) => a.x * b.y - a.y * b.x,
  len: a => Math.hypot(a.x, a.y),
  dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  unit: a => { const l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; },
  mid: (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }),
};
const DEG = 180 / Math.PI;

export function angleAt(P, V, Q) {
  const u = V2.sub(P, V), w = V2.sub(Q, V);
  const c = V2.dot(u, w) / ((V2.len(u) * V2.len(w)) || 1);
  return Math.acos(Math.max(-1, Math.min(1, c))) * DEG;
}
// Пересечение прямых P1P2 и Q1Q2 → { pt, t, s } (t — параметр на первой, s — на второй)
export function lineIntersect(P1, P2, Q1, Q2) {
  const r = V2.sub(P2, P1), s = V2.sub(Q2, Q1);
  const den = V2.cross(r, s);
  if (Math.abs(den) < 1e-12) return null;
  const qp = V2.sub(Q1, P1);
  const t = V2.cross(qp, s) / den, u = V2.cross(qp, r) / den;
  return { pt: V2.add(P1, V2.mul(r, t)), t, s: u };
}
export function footOf(P, A, B) {
  const d = V2.sub(B, A); const t = V2.dot(V2.sub(P, A), d) / (V2.dot(d, d) || 1);
  return { pt: V2.add(A, V2.mul(d, t)), t };
}
function polyArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a.x * b.y - b.x * a.y; }
  return s / 2;
}

/* ---------------- фигуры ---------------- */
// Каждая фигура: канонический порядок вершин C (для трапеции — так, что основания
// C0C3 и C1C2), параметры по умолчанию, функция параметры → координаты и
// дополнительные невязки-свойства.
function figureSpec(fig) {
  const V = fig.vertices;
  const t = fig.type;
  if (t === 'triangle') {
    let def = [7, 2.4, 4.2];
    const cons = [];
    const ri = fig.rightAngle ? V.indexOf(fig.rightAngle) : (fig.right || fig.isoRight ? 2 : -1);
    if (ri >= 0) {
      def = ri === 0 ? [7, 0, 4.6] : ri === 2 ? [7, 7, 4.6] : [8, 2.9, Math.sqrt(2.9 * 5.1)];
      if (fig.isoRight) def = ri === 0 ? [6, 0, 6] : ri === 2 ? [6, 6, 6] : [8, 4, 4];
      cons.push({ w: 1, f: P => (angleAt(P[(ri + 2) % 3], P[ri], P[(ri + 1) % 3]) - 90) / 45, what: 'right' });
    }
    if (fig.isoRight && ri >= 0) {
      cons.push({ w: 1, f: P => (V2.dist(P[ri], P[(ri + 1) % 3]) - V2.dist(P[ri], P[(ri + 2) % 3])), what: 'iso', len: true });
    }
    if (fig.isosceles || fig.base) {
      const base = fig.base || (V[0] + V[2]);
      const bi = [V.indexOf(base[0]), V.indexOf(base[1])];
      const apex = [0, 1, 2].find(i => !bi.includes(i));
      if (apex === 1) def = [7, 3.5, 4.6];
      else if (apex === 0) def = [7, 3.5, -0.0001 + 4.6]; // вершина A: подгонится
      cons.push({ w: 1, f: P => (V2.dist(P[apex], P[bi[0]]) - V2.dist(P[apex], P[bi[1]])), what: 'iso', len: true });
    }
    if (fig.equilateral) {
      def = [7, 3.5, 7 * Math.sqrt(3) / 2];
      cons.push({ w: 1, f: P => V2.dist(P[0], P[1]) - V2.dist(P[1], P[2]), len: true });
      cons.push({ w: 1, f: P => V2.dist(P[0], P[2]) - V2.dist(P[1], P[2]), len: true });
    }
    return {
      C: V.slice(), def, cons,
      build: p => [{ x: 0, y: 0 }, { x: p[1], y: p[2] }, { x: p[0], y: 0 }],
    };
  }
  if (t === 'parallelogram' || t === 'rhombus' || t === 'rectangle' || t === 'square') {
    const cons = [];
    let def = [8, 2, 3.46];
    if (t === 'rectangle') def = [8, 0, 4.5];
    if (t === 'rhombus') def = [6, 3, 5.196];
    if (t === 'square') def = [6, 0, 6];
    if (t === 'rectangle' || t === 'square') cons.push({ w: 1, f: P => (angleAt(P[1], P[0], P[3]) - 90) / 45 });
    if (t === 'rhombus' || t === 'square') cons.push({ w: 1, f: P => V2.dist(P[0], P[1]) - V2.dist(P[0], P[3]), len: true });
    return {
      C: V.slice(), def, cons,
      build: p => {
        const A = { x: 0, y: 0 }, D = { x: p[0], y: 0 }, B = { x: p[1], y: p[2] };
        return [A, B, { x: B.x + D.x, y: B.y }, D];
      },
    };
  }
  if (t === 'trapezoid') {
    // основания C0C3 (нижнее) и C1C2 (верхнее)
    const bs = trapBases(fig);
    let C = V.slice();
    for (let k = 0; k < 4; k++) {
      const R = V.slice(k).concat(V.slice(0, k));
      const b1 = R[0] + R[3], b2 = R[1] + R[2];
      const has = s => bs.some(b => b === s || b === s[1] + s[0]);
      if (has(b1) && has(b2)) { C = R; break; }
    }
    const cons = [];
    let def = [9, 2, 4, 7];
    if (fig.isosceles) cons.push({ w: 1, f: P => V2.dist(P[0], P[1]) - V2.dist(P[2], P[3]), len: true });
    if (fig.rightTrap) { def = [9, 0, 4, 5]; cons.push({ w: 1, f: P => (angleAt(P[1], P[0], P[3]) - 90) / 45 }); }
    // верхнее основание — положительной длины
    cons.push({ w: 0.2, soft: true, f: P => Math.min(0, P[2].x - P[1].x - 0.2) });
    return {
      C, def, cons,
      build: p => [{ x: 0, y: 0 }, { x: p[1], y: p[2] }, { x: p[3], y: p[2] }, { x: p[0], y: 0 }],
    };
  }
  // произвольный четырёхугольник
  return {
    C: V.slice(), def: [8, 1.5, 4, 6.5, 4.8], cons: [],
    build: p => [{ x: 0, y: 0 }, { x: p[1], y: p[2] }, { x: p[3], y: p[4] }, { x: p[0], y: 0 }],
  };
}

/* ---------------- построения ---------------- */
function neighbours(V, v) {
  const i = V.indexOf(v), n = V.length;
  if (i < 0) return null;
  return [V[(i - 1 + n) % n], V[(i + 1) % n]];
}

// Все точки модели по параметрам. extra — параметры «свободных» точек на отрезках.
function buildAll(model, p) {
  const spec = model.spec;
  const base = spec.build(p.slice(0, spec.def.length));
  const pts = {};
  spec.C.forEach((name, i) => { pts[name] = base[i]; });
  const info = {};   // name → { t (параметр на целевом отрезке) }
  let extraIdx = spec.def.length;
  const V = model.ir.figure.vertices;
  const pending = model.ir.constructions.slice();
  const extraOf = new Map();
  model.ir.constructions.forEach(c => { if (c.kind === 'pointOn') extraOf.set(c, extraIdx++); });
  for (let pass = 0; pass < 4 && pending.length; pass++) {
    for (let k = 0; k < pending.length; k++) {
      const c = pending[k];
      const r = constructOne(c, pts, V, p, extraOf.get(c));
      if (r === undefined) continue;   // зависимости ещё не построены
      pending.splice(k--, 1);
      if (r && c.point) { pts[c.point] = r.pt; info[c.point] = r; }
    }
  }
  return { pts, info };
}

function constructOne(c, pts, V, p, extraIdx) {
  const P = n => pts[n];
  const need = names => names.every(n => pts[n]);
  switch (c.kind) {
    case 'bisector': {
      const ang = c.angle || (neighbours(V, c.vertex) ? neighbours(V, c.vertex)[0] + c.vertex + neighbours(V, c.vertex)[1] : null);
      if (!ang || !c.target || !need([ang[0], ang[1], ang[2], c.target[0], c.target[1]])) return undefined;
      const Vt = P(ang[1]);
      const d = V2.add(V2.unit(V2.sub(P(ang[0]), Vt)), V2.unit(V2.sub(P(ang[2]), Vt)));
      const X = lineIntersect(Vt, V2.add(Vt, d), P(c.target[0]), P(c.target[1]));
      if (!X) return null;
      c.angle = ang;
      return { pt: X.pt, t: X.s, ray: X.t };
    }
    case 'bisectorMeet': {
      const [a, b] = c.vertices;
      const na = neighbours(V, a), nb = neighbours(V, b);
      if (!na || !nb) return null;
      const dir = (v, n) => V2.add(V2.unit(V2.sub(P(n[0]), P(v))), V2.unit(V2.sub(P(n[1]), P(v))));
      const X = lineIntersect(P(a), V2.add(P(a), dir(a, na)), P(b), V2.add(P(b), dir(b, nb)));
      return X ? { pt: X.pt } : null;
    }
    case 'median': case 'midpoint': {
      const s = c.kind === 'median' ? c.target : c.seg;
      if (!s || !need([s[0], s[1]])) return undefined;
      return { pt: V2.mid(P(s[0]), P(s[1])), t: 0.5 };
    }
    case 'altitude': {
      if (!c.target || !need([c.vertex, c.target[0], c.target[1]])) return undefined;
      const f = footOf(P(c.vertex), P(c.target[0]), P(c.target[1]));
      return { pt: f.pt, t: f.t };
    }
    case 'intersection': {
      const [l1, l2] = c.lines;
      if (!need([l1[0], l1[1], l2[0], l2[1]])) return undefined;
      const X = lineIntersect(P(l1[0]), P(l1[1]), P(l2[0]), P(l2[1]));
      return X ? { pt: X.pt, t: X.t } : null;
    }
    case 'pointOn': {
      if (!c.seg || !need([c.seg[0], c.seg[1]])) return undefined;
      const t = p[extraIdx];
      return { pt: V2.add(P(c.seg[0]), V2.mul(V2.sub(P(c.seg[1]), P(c.seg[0])), t)), t };
    }
    case 'segment': return null;
    default: return null;
  }
}

/* ---------------- величины ---------------- */
export function quantity(model, pts, q) {
  const V = model.ir.figure.vertices;
  const P = n => { if (!pts[n]) throw new Error('нет точки ' + n); return pts[n]; };
  switch (q.kind) {
    case 'length': return V2.dist(P(q.seg[0]), P(q.seg[q.seg.length - 1]));
    case 'angle': {
      const a = q.angle;
      if (a.length === 3) return angleAt(P(a[0]), P(a[1]), P(a[2]));
      const nb = neighbours(V, a);
      if (!nb) throw new Error('угол ' + a);
      return angleAt(P(nb[0]), P(a), P(nb[1]));
    }
    case 'perimeter': {
      const names = (q.of || V.join('')).split('');
      let s = 0; for (let i = 0; i < names.length; i++) s += V2.dist(P(names[i]), P(names[(i + 1) % names.length]));
      return s;
    }
    case 'area': {
      const names = (q.of || V.join('')).split('');
      return Math.abs(polyArea(names.map(P)));
    }
    case 'trig': {
      const a = quantity(model, pts, { kind: 'angle', angle: q.angle }) * Math.PI / 180;
      return q.fn === 'sin' ? Math.sin(a) : q.fn === 'cos' ? Math.cos(a) : q.fn === 'ctg' ? 1 / Math.tan(a) : Math.tan(a);
    }
    case 'midline': {
      const C = model.spec.C;
      return (V2.dist(P(C[0]), P(C[3])) + V2.dist(P(C[1]), P(C[2]))) / 2;
    }
    case 'inradius': case 'circumradius': case 'centersDist': {
      if (V.length === 4) {
        // прямоугольник/квадрат: R = d/2; квадрат/ромб: r = h/2
        const d = V2.dist(P(V[0]), P(V[2]));
        if (q.kind === 'circumradius') return d / 2;
        const a = V2.dist(P(V[0]), P(V[1])), b = V2.dist(P(V[0]), P(V[3]));
        const area = Math.abs(V2.cross(V2.sub(P(V[1]), P(V[0])), V2.sub(P(V[3]), P(V[0]))));
        if (q.kind === 'inradius') return area / Math.max(a, b) / 2;
        return 0;
      }
      const [A, B, C] = V.slice(0, 3).map(P);
      const c = triCircles(A, B, C);
      return q.kind === 'inradius' ? c.r : q.kind === 'circumradius' ? c.R : V2.dist(c.I, c.O);
    }
    default: throw new Error('величина ' + q.kind);
  }
}

// Вписанная и описанная окружности треугольника: центры I, O и радиусы r, R.
export function triCircles(A, B, C) {
  const a = V2.dist(B, C), b = V2.dist(A, C), c = V2.dist(A, B);
  const p = a + b + c;
  const I = { x: (a * A.x + b * B.x + c * C.x) / p, y: (a * A.y + b * B.y + c * C.y) / p };
  const S = Math.abs(V2.cross(V2.sub(B, A), V2.sub(C, A))) / 2;
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  const sq = P => P.x * P.x + P.y * P.y;
  const O = { x: (sq(A) * (B.y - C.y) + sq(B) * (C.y - A.y) + sq(C) * (A.y - B.y)) / d, y: (sq(A) * (C.x - B.x) + sq(B) * (A.x - C.x) + sq(C) * (B.x - A.x)) / d };
  return { I, O, r: 2 * S / p, R: a * b * c / (4 * S) };
}

/* ---------------- невязки ---------------- */
function residuals(model, p, opts) {
  const { pts, info } = buildAll(model, p);
  const L = model.scale;
  const out = [];     // точные условия (для проверки определённости)
  const soft = [];    // мягкие пожелания (положение «на стороне» и т. п.)
  const safe = f => { try { const v = f(); return Number.isFinite(v) ? v : 1e3; } catch (e) { return 1e3; } };
  for (const g of model.ir.given) {
    switch (g.kind) {
      case 'length': out.push(safe(() => (quantity(model, pts, g) - g.value) / L)); break;
      case 'angle': out.push(safe(() => (quantity(model, pts, g) - g.value) / 45)); break;
      case 'perimeter': out.push(safe(() => (quantity(model, pts, g) - g.value) / (g.value || 1))); break;
      case 'area': out.push(safe(() => (quantity(model, pts, g) - g.value) / (g.value || 1))); break;
      case 'ratio': out.push(safe(() => {
        const a = quantity(model, pts, { kind: 'length', seg: g.segs[0] }), b = quantity(model, pts, { kind: 'length', seg: g.segs[1] });
        return (a * g.ratio[1] - b * g.ratio[0]) / (L * (g.ratio[0] + g.ratio[1]) / 2);
      })); break;
      case 'mult': out.push(safe(() => (quantity(model, pts, { kind: 'length', seg: g.a }) - g.k * quantity(model, pts, { kind: 'length', seg: g.b })) / L)); break;
      case 'diff': out.push(safe(() => (quantity(model, pts, { kind: 'length', seg: g.a }) - quantity(model, pts, { kind: 'length', seg: g.b }) - g.value) / L)); break;
      case 'angleMult': out.push(safe(() => (quantity(model, pts, { kind: 'angle', angle: g.a }) - g.k * quantity(model, pts, { kind: 'angle', angle: g.b })) / 45)); break;
      case 'angleDiff': out.push(safe(() => (quantity(model, pts, { kind: 'angle', angle: g.a }) - quantity(model, pts, { kind: 'angle', angle: g.b }) - g.value) / 45)); break;
      case 'angleRatio': out.push(safe(() => (quantity(model, pts, { kind: 'angle', angle: g.a }) * g.ratio[1] - quantity(model, pts, { kind: 'angle', angle: g.b }) * g.ratio[0]) / 45 / ((g.ratio[0] + g.ratio[1]) / 2))); break;
      case 'inradius': case 'circumradius': out.push(safe(() => (quantity(model, pts, { kind: g.kind }) - g.value) / L)); break;
      case 'midline': out.push(safe(() => {
        const C = model.spec.C;
        return ((V2.dist(pts[C[0]], pts[C[3]]) + V2.dist(pts[C[1]], pts[C[2]])) / 2 - g.value) / L;
      })); break;
      case 'onLine': out.push(safe(() => {
        const A = pts[g.seg[0]], B = pts[g.seg[1]], X = pts[g.point];
        return V2.cross(V2.sub(B, A), V2.sub(X, A)) / (V2.len(V2.sub(B, A)) || 1) / L;
      })); break;
      default: break;
    }
  }
  for (const c of model.spec.cons) {
    const v = safe(() => c.f(model.spec.C.map(n => pts[n])));
    (c.soft ? soft : out).push(c.w * (c.len ? v / L : v));
  }
  // «угол B тупой / острый»
  for (const g of model.ir.given) {
    if (g.kind !== 'obtuse' && g.kind !== 'acute') continue;
    let a; try { a = quantity(model, pts, { kind: 'angle', angle: g.angle }); } catch (e) { continue; }
    soft.push(g.kind === 'obtuse' ? Math.min(0, a - 95) / 30 : Math.max(0, a - 85) / 30);
  }
  // Точка построения — на самой стороне (а не на продолжении): мягко.
  for (const c of model.ir.constructions) {
    const r = info[c.point];
    if (r && typeof r.t === 'number' && ['bisector', 'altitude', 'pointOn', 'intersection'].includes(c.kind)) {
      soft.push(0.3 * (Math.min(0, r.t - 0.04) + Math.max(0, r.t - 0.96)));
    }
    if (c.kind === 'pointOn') soft.push(0.3 * (Math.min(0, p[model.extraIdx[c.point]] - 0.05) + Math.max(0, p[model.extraIdx[c.point]] - 0.95)));
  }
  // Фигура не выворачивается (ориентация как у типовой).
  soft.push(0.5 * Math.min(0, -polyArea(model.spec.C.map(n => pts[n])) / (L * L) * model.orient - 0.05));
  if (opts && opts.reg) {
    for (let i = 0; i < p.length; i++) soft.push(opts.reg * (p[i] - model.p0[i]) / (i < model.spec.def.length ? L : 1));
  }
  return { exact: out, soft };
}

function totalRes(model, p, reg) {
  const r = residuals(model, p, { reg });
  return r.exact.concat(r.soft);
}

/* ---------------- Левенберг — Марквардт ---------------- */
function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => row.concat([b[i]]));
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-18) return null;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

function jacobian(f, p) {
  const r0 = f(p);
  const J = r0.map(() => new Array(p.length).fill(0));
  for (let j = 0; j < p.length; j++) {
    const h = 1e-6 * Math.max(1, Math.abs(p[j]));
    const q = p.slice(); q[j] += h;
    const r1 = f(q);
    for (let i = 0; i < r0.length; i++) J[i][j] = (r1[i] - r0[i]) / h;
  }
  return { r0, J };
}
const sumsq = r => r.reduce((s, x) => s + x * x, 0);

function levenberg(f, p, iters) {
  let mu = 1e-3;
  let r = f(p), cost = sumsq(r);
  for (let it = 0; it < (iters || 200) && cost > 1e-26; it++) {
    const { r0, J } = jacobian(f, p);
    const n = p.length;
    const JtJ = Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, b) => J.reduce((s, row) => s + row[a] * row[b], 0)));
    const Jtr = Array.from({ length: n }, (_, a) => J.reduce((s, row, i) => s + row[a] * r0[i], 0));
    let improved = false;
    for (let tries = 0; tries < 12; tries++) {
      const A = JtJ.map((row, a) => row.map((v, b) => v + (a === b ? mu * (v + 1e-9) + 1e-12 : 0)));
      const d = solveLinear(A, Jtr.map(v => -v));
      if (!d) { mu *= 10; continue; }
      const q = p.map((v, i) => v + d[i]);
      const rq = f(q), cq = sumsq(rq);
      if (cq < cost) { p = q; r = rq; const gain = cost - cq; cost = cq; mu = Math.max(1e-12, mu / 3); improved = true; if (gain < 1e-30) it = 1e9; break; }
      mu *= 4;
    }
    if (!improved) break;
  }
  return { p, cost };
}

/* ---------------- модель целиком ---------------- */
export function buildModel(ir) {
  if (!ir || !ir.figure) throw new Error('не указана фигура');
  const spec = figureSpec(ir.figure);
  const model = { ir, spec, scale: 1, extraIdx: {}, orient: 1 };
  // масштаб: средняя данная длина против средней стороны типовой фигуры
  const defPts = spec.build(spec.def);
  const n = defPts.length;
  let defMean = 0; for (let i = 0; i < n; i++) defMean += V2.dist(defPts[i], defPts[(i + 1) % n]); defMean /= n;
  const lens = [];
  for (const g of ir.given) {
    if (g.kind === 'length') lens.push(g.value);
    if (g.kind === 'perimeter') lens.push(g.value / n);
    if (g.kind === 'area') lens.push(Math.sqrt(g.value / (Math.abs(polyArea(defPts)) / (defMean * defMean) || 1)));
    if (g.kind === 'diff') lens.push(Math.abs(g.value) * 2);
    if (g.kind === 'midline') lens.push(g.value);
    if (g.kind === 'inradius') lens.push(g.value * 3);
    if (g.kind === 'circumradius') lens.push(g.value * 1.5);
  }
  const s = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length / defMean : 1;
  model.scale = defMean * s;
  const p0 = spec.def.map(v => v * s);
  for (const c of ir.constructions) if (c.kind === 'pointOn') { model.extraIdx[c.point] = p0.length; p0.push(0.4); }
  model.p0 = p0;
  model.orient = Math.sign(-polyArea(defPts)) || 1;

  // Несколько стартов: типовая фигура и её «встряхнутые» варианты.
  const starts = [p0.slice()];
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let k = 0; k < 6; k++) starts.push(p0.map((v, i) => v * (0.6 + 0.8 * rnd()) + (i >= spec.def.length ? 0 : (rnd() - 0.5) * 0.3 * model.scale)));
  let best = null;
  for (const st of starts) {
    const a = levenberg(p => totalRes(model, p, 0.02), st, 150);
    const b = levenberg(p => totalRes(model, p, 1e-6), a.p, 150);
    const exact = sumsq(residuals(model, b.p).exact);
    const dist = sumsq(b.p.map((v, i) => (v - p0[i]) / model.scale));
    const score = exact * 1e6 + dist * 1e-3;
    if (!best || score < best.score) best = { p: b.p, exact, score };
    if (exact < 1e-18 && k0(starts, st)) break;
  }
  model.p = best.p;
  model.residual = best.exact;
  model.consistent = best.exact < 1e-8;
  const built = buildAll(model, model.p);
  model.pts = built.pts;
  model.info = built.info;
  return model;
}
function k0(starts, st) { return starts[0] === st; }

// Значение величины в модели.
export function evalQ(model, q) { return quantity(model, model.pts, q); }

// Определена ли величина данными: её градиент по параметрам должен выражаться
// через градиенты точных условий.
export function isDetermined(model, q) {
  const f = p => residuals(model, p).exact;
  const { J } = jacobian(f, model.p);
  const g = model.p.map((v, j) => {
    const h = 1e-6 * Math.max(1, Math.abs(v));
    const a = model.p.slice(); a[j] += h;
    const b = model.p.slice(); b[j] -= h;
    try { return (quantity(model, buildAll(model, a).pts, q) - quantity(model, buildAll(model, b).pts, q)) / (2 * h); } catch (e) { return 0; }
  });
  const gn = Math.hypot(...g);
  if (gn < 1e-7) return true;
  const m = J.length;
  if (!m) return false;
  const A = Array.from({ length: m }, (_, a) => Array.from({ length: m }, (_, b) => J[a].reduce((s, v, k) => s + v * J[b][k], 0) + (a === b ? 1e-10 : 0)));
  const rhs = J.map(row => row.reduce((s, v, k) => s + v * g[k], 0));
  const w = solveLinear(A, rhs);
  if (!w) return false;
  const proj = g.map((_, k) => J.reduce((s, row, i) => s + row[k] * w[i], 0));
  const rel = Math.hypot(...g.map((v, k) => v - proj[k])) / gn;
  return rel < 2e-3;
}

// Какие основные величины фигуры пришлось «додумать» (для подписи под чертежом).
export function assumedQuantities(model) {
  const V = model.ir.figure.vertices;
  const cands = [];
  V.forEach(v => cands.push({ kind: 'angle', angle: v }));
  for (let i = 0; i < V.length; i++) cands.push({ kind: 'length', seg: V[i] + V[(i + 1) % V.length] });
  for (const c of model.ir.constructions) if (c.kind === 'pointOn') cands.push({ kind: 'length', seg: c.seg[0] + c.point });
  const out = [];
  const saved = model.ir.given;
  try {
    for (const q of cands) {
      if (isDetermined(model, q)) continue;
      const val = quantity(model, model.pts, q);
      out.push({ q, value: val });
      // фиксируем и смотрим дальше
      model.ir = Object.assign({}, model.ir, { given: model.ir.given.concat([Object.assign({}, q, { value: val })]) });
      if (out.length >= 3) break;
    }
  } finally { model.ir = Object.assign({}, model.ir, { given: saved }); }
  return out;
}
