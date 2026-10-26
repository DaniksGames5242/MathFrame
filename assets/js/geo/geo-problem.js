// assets/js/geo/geo-problem.js
// Точка входа геометрического решателя: текст задачи → условие (IR) → численная
// модель → решение по шагам → чертёж на GMS.
//
//   const r = await solveGeometryProblem(text, { ai, theme });
//   r = { ok, ir, source: 'local' | 'ai', steps: [{html}], answers: [...],
//         gms, notes: [..], error? }
//
// ai(text, draftIr) — необязательная функция (geo-ai.js), которая вызывается,
// когда локальный разбор не понял формулировку: возвращает IR от нейросети.

import { parseProblem, freeName } from './geo-parse.js';
import { normalizeMarkup } from './geo-markup.js';
import { buildModel, evalQ, isDetermined, assumedQuantities } from './geo-model.js';
import { solveProblem, coordinateSolution, num, I, ANG, italicNames } from './geo-reason.js';
import { buildGms, sketchToGms } from './geo-gms.js';
import { solveBasic } from './geo-basic.js';

const FIG_TYPES = ['triangle', 'parallelogram', 'rhombus', 'rectangle', 'square', 'trapezoid', 'quadrilateral'];
const RU_Q = { length: 'отрезок', angle: 'угол', area: 'площадь', perimeter: 'периметр', inradius: 'радиус вписанной окружности', circumradius: 'радиус описанной окружности', centersDist: 'расстояние между центрами' };

// Приводит IR (в том числе от ИИ) к виду, который понимает решатель.
export function validateIr(ir) {
  if (!ir || typeof ir !== 'object' || !ir.figure) throw new Error('нет фигуры');
  const fig = ir.figure;
  if (!FIG_TYPES.includes(fig.type)) throw new Error('фигура «' + fig.type + '» пока не поддерживается');
  const n = fig.type === 'triangle' ? 3 : 4;
  let V = Array.isArray(fig.vertices) ? fig.vertices : String(fig.vertices || '').split('');
  V = V.map(x => String(x).trim().toUpperCase()).filter(Boolean);
  if (V.length !== n) V = 'ABCD'.slice(0, n).split('');
  fig.vertices = V;
  const isName = s => typeof s === 'string' && /^[A-Z][0-9]?$/.test(s);
  const isSeg = s => typeof s === 'string' && /^[A-Z][A-Z]$/.test(s);
  ir.given = (ir.given || []).filter(g => g && typeof g === 'object').map(g => {
    if (typeof g.value === 'string') g.value = parseFloat(g.value.replace(',', '.'));
    if (g.seg) g.seg = String(g.seg).toUpperCase();
    if (g.angle) g.angle = String(g.angle).toUpperCase().replace(/[^A-Z]/g, '');
    return g;
  }).filter(g => {
    if (g.kind === 'length') return isSeg(g.seg) && g.value > 0;
    if (g.kind === 'angle') return (g.angle.length === 1 || g.angle.length === 3) && g.value > 0 && g.value < 180;
    if (g.kind === 'perimeter' || g.kind === 'area') return g.value > 0;
    if (g.kind === 'ratio') return Array.isArray(g.segs) && g.segs.every(isSeg) && Array.isArray(g.ratio);
    if (g.kind === 'mult') return isSeg(g.a) && isSeg(g.b) && g.k > 0;
    if (g.kind === 'diff') return isSeg(g.a) && isSeg(g.b) && Number.isFinite(g.value);
    if (g.kind === 'onLine') return isName(g.point) && isSeg(g.seg);
    if (g.kind === 'midline') return g.value > 0 && fig.type === 'trapezoid';
    if (g.kind === 'angleMult') return typeof g.a === 'string' && typeof g.b === 'string' && g.k > 0;
    if (g.kind === 'angleDiff') return typeof g.a === 'string' && typeof g.b === 'string' && Number.isFinite(g.value);
    if (g.kind === 'angleRatio') return typeof g.a === 'string' && typeof g.b === 'string' && Array.isArray(g.ratio);
    if (g.kind === 'inradius' || g.kind === 'circumradius') return g.value > 0;
    if (g.kind === 'obtuse' || g.kind === 'acute') return typeof g.angle === 'string' && g.angle.length >= 1;
    return false;
  });
  ir.constructions = (ir.constructions || []).filter(c => c && typeof c === 'object' && typeof c.kind === 'string');
  ir.find = (ir.find || []).filter(f => f && ['length', 'angle', 'area', 'perimeter', 'inradius', 'circumradius', 'centersDist', 'trig', 'midline'].includes(f.kind));
  if (!ir.find.length) throw new Error('не понятно, что нужно найти');
  // Все упомянутые точки должны быть вершинами фигуры или точками построений.
  const known = new Set(V.concat(ir.constructions.map(c => c.point).filter(Boolean), (ir.circles || []).map(c => c.center)));
  const pts = [];
  for (const x of ir.given.concat(ir.find)) {
    for (const k of ['seg', 'a', 'b', 'point']) if (typeof x[k] === 'string' && !(x.kind && /^angle/.test(x.kind))) pts.push(...x[k].match(/[A-Z][0-9]?/g) || []);
    if (x.angle && x.angle.length === 3) pts.push(...x.angle.split(''));
    for (const k of ['a', 'b']) if (x.kind && /^angle/.test(x.kind) && typeof x[k] === 'string') pts.push(...x[k].split(''));
    if (x.segs) x.segs.forEach(sg => pts.push(...sg.match(/[A-Z][0-9]?/g) || []));
    if (x.of) pts.push(...x.of.split(''));
  }
  for (const c of ir.constructions) for (const k of ['vertex', 'target', 'seg']) if (typeof c[k] === 'string') pts.push(...c[k].match(/[A-Z][0-9]?/g) || []);
  const miss = [...new Set(pts.filter(n => !known.has(n)))];
  if (miss.length) throw new Error('в условии есть точки, построение которых не понято: ' + miss.join(', '));
  // Трапеция с равными боковыми сторонами — равнобедренная.
  if (fig.type === 'trapezoid' && !fig.isosceles) {
    const bs = fig.bases || [V[0] + V[3], V[1] + V[2]];
    const legs = [bs[0][0] + bs[1][0], bs[0][1] + bs[1][1]];
    const lv = s => { const g = ir.given.find(x => x.kind === 'length' && (x.seg === s || x.seg === s[1] + s[0])); return g ? g.value : null; };
    const alt = [bs[0][0] + bs[1][1], bs[0][1] + bs[1][0]];
    for (const L of [legs, alt]) {
      const a = lv(L[0]), b = lv(L[1]);
      const isLeg = !(bs.includes(L[0]) || bs.includes(L[0][1] + L[0][0]));
      if (a !== null && b !== null && Math.abs(a - b) < 1e-9 && isLeg && V.includes(L[0][0])) { fig.isosceles = true; fig.isoFromData = true; }
    }
  }
  ir.unit = typeof ir.unit === 'string' ? ir.unit : '';
  return ir;
}

// Аккуратные «средние» значения для недостающих данных: углы — кратные 5°, длины — 0,5.
function niceValue(q, v) {
  if (q.kind === 'angle') return Math.min(170, Math.max(10, Math.round(v / 5) * 5));
  const step = v > 20 ? 1 : 0.5;
  return Math.max(step, Math.round(v / step) * step);
}

// Дополнительные построения, которые пробуются, если без них решение не выходит.
function auxCandidates(ir) {
  const fig = ir.figure, V = fig.vertices, t = fig.type;
  const out = [];
  const used = () => ({ constructions: ir.constructions.concat(out.flat()), given: ir.given });
  const nameFor = pref => freeName({ constructions: ir.constructions.concat(out.flat()), given: ir.given }, V, pref);
  if (t === 'trapezoid') {
    // высоты из концов меньшего основания
    const bs = fig.bases || [V[0] + V[3], V[1] + V[2]];
    const top = bs[1], bottom = bs[0];
    const have = v => ir.constructions.some(c => c.kind === 'altitude' && c.vertex === v);
    const h1 = have(top[0]) || fig.rightTrap ? null : { kind: 'altitude', vertex: top[0], target: bottom, point: nameFor('H'), aux: true };
    if (h1) out.push([h1]);
    const h2 = have(top[1]) ? null : { kind: 'altitude', vertex: top[1], target: bottom, point: freeName({ constructions: ir.constructions.concat(h1 ? [h1] : []), given: ir.given }, V, 'K'), aux: true };
    if (h2) { out.push([h2]); if (h1) out.push([h1, h2]); }
  }
  if (['parallelogram', 'rhombus'].includes(t)) out.push([{ kind: 'altitude', vertex: V[1], target: V[0] + V[3], point: nameFor('H'), aux: true }]);
  if (t === 'triangle') {
    out.push([{ kind: 'altitude', vertex: V[1], target: V[0] + V[2], point: nameFor('H'), aux: true }]);
    out.push([{ kind: 'altitude', vertex: V[0], target: V[1] + V[2], point: nameFor('H'), aux: true }]);
    out.push([{ kind: 'altitude', vertex: V[2], target: V[0] + V[1], point: nameFor('H'), aux: true }]);
  }
  if (V.length === 4 && !ir.constructions.some(c => c.kind === 'intersection')) {
    out.push([{ kind: 'intersection', lines: [V[0] + V[2], V[1] + V[3]], point: nameFor('O'), aux: true }]);
  }
  void used;
  return out;
}

function auxText(cs) {
  const parts = cs.map(c => {
    if (c.kind === 'altitude') return 'высоту ' + I(c.vertex + c.point) + ' к ' + I(c.target);
    if (c.kind === 'intersection') return 'диагонали ' + I(c.lines[0]) + ' и ' + I(c.lines[1]) + ', ' + I(c.point) + ' — точка их пересечения';
    return '';
  }).filter(Boolean);
  if (!parts.length) return '';
  return 'Проведём ' + (cs.length > 1 && cs.every(c => c.kind === 'altitude') ? 'высоты ' + cs.map(c => I(c.vertex + c.point)).join(' и ') + ' к ' + I(cs[0].target) : parts.join(' и ')) + '.';
}

// Эскиз нейросети подгоняем под вид фигуры из условия («квадрат ABCD» — настоящий
// квадрат): аффинное преобразование по трём вершинам сохраняет середины, точки на
// сторонах, параллельность и пересечения.
export function fixSketch(sk, text) {
  if (!sk || !sk.points) return sk;
  const t = normalizeMarkup(String(text || ''));
  const m = t.match(/(квадрат|прямоугольник|ромб)\S*\s+([A-Z])([A-Z])([A-Z])([A-Z])/i);
  if (!m) return sk;
  const P = sk.points, [A, B, , D] = [m[2], m[3], m[4], m[5]].map(n => P[n] && { x: +P[n][0], y: +P[n][1] });
  if (!A || !B || !D) return sk;
  const u = { x: B.x - A.x, y: B.y - A.y }, w = { x: D.x - A.x, y: D.y - A.y };
  const det = u.x * w.y - u.y * w.x;
  if (Math.abs(det) < 1e-9) return sk;
  const lu = Math.hypot(u.x, u.y), lw = Math.hypot(w.x, w.y), sgn = det > 0 ? 1 : -1;
  const kind = m[1].toLowerCase();
  // новые векторы AB', AD'
  const perp = { x: -u.y * sgn, y: u.x * sgn };
  let w2;
  if (/квадрат/.test(kind)) w2 = perp;
  else if (/прямоуг/.test(kind)) w2 = { x: perp.x / lu * lw, y: perp.y / lu * lw };
  else { const cs = (u.x * w.x + u.y * w.y) / (lu * lw); const ang = Math.acos(Math.max(-1, Math.min(1, cs))); w2 = { x: (u.x * Math.cos(ang) - u.y * Math.sin(ang) * sgn), y: (u.x * Math.sin(ang) * sgn + u.y * Math.cos(ang)) }; }
  // p = A + a·u + b·w  →  A + a·u + b·w2
  const pts = {};
  for (const [n, v] of Object.entries(P)) {
    if (!Array.isArray(v)) { pts[n] = v; continue; }
    const px = v[0] - A.x, py = v[1] - A.y;
    const a = (px * w.y - py * w.x) / det, b = (u.x * py - u.y * px) / det;
    pts[n] = [A.x + a * u.x + b * w2.x, A.y + a * u.y + b * w2.y];
  }
  return Object.assign({}, sk, { points: pts });
}

// Школьная задача без обозначений точек — по формулам (с чертежом, если фигуру можно построить).
function basicOrNull(text, opts) {
  if (checkProblemText(text)) return null;
  let b;
  try { b = solveBasic(normalizeMarkup(text)); } catch (e) { b = null; }
  if (!b) return null;
  b.gms = '';
  if (b.draw) {
    try {
      const ir = validateIr(JSON.parse(JSON.stringify(b.draw)));
      const m = buildModel(ir);
      if (m.consistent) b.gms = buildGms(ir, m, null, { theme: opts.theme });
    } catch (e) { b.gms = ''; }
  }
  return b;
}
export async function solveGeometryProblem(text, opts) {
  opts = opts || {};
  const basic = basicOrNull(text, opts);
  if (basic) return basic;
  const r = await solveLocalOrIr(text, opts);
  if (r.ok || r.invalid || !opts.aiSolve) return r;
  // Задача вне модели решателя (окружности, ГМТ, преобразования, буквенные данные):
  // полное решение — нейросетью, чертёж — по её эскизу.
  try {
    const d = await opts.aiSolve(text);
    let gms = '';
    try { gms = sketchToGms(fixSketch(d.sketch, text), { theme: opts.theme }); } catch (e) { gms = ''; }
    return { ok: true, source: 'ai-solve', method: 'ai', steps: [], stepsMd: d.steps, answerMd: d.answer, answers: [], gms, sketch: d.sketch || null, notes: ['Эту задачу решила нейросеть: локальный решатель пока не умеет ' + (r.error ? 'разбирать такие условия' : 'такие построения') + '. Проверьте рассуждения.'] };
  } catch (e) {
    return Object.assign({}, r, { error: r.error + ' Нейросеть тоже не помогла: ' + (e && e.message ? e.message : e) });
  }
}

// Похоже ли на геометрическую задачу: → null или текст ошибки.
const GEO_WORDS = /треуг|параллелограм|ромб|квадрат|прямоугольн|трапец|четырехуг|многоуг|окружн|круг|угол|угл[аоуы]|сторон|отрез|точк|прям[аоуы]|биссектр|медиан|высот|диагонал|радиус|диаметр|хорд|касател|секущ|площад|периметр|вектор|плоскост|куб|пирамид|призм|шар|сфер|конус|цилиндр|параллелепип|тетраэдр|катет|гипотенуз|основани|вершин|перпендикул|параллельн|∠|△/;
const TASK_WORDS = /найд|найти|вычисл|докаж|определ|чему\s+равн|сколько|как[аоуи][йяем]|в\s+каком|постро|покаж|\?/;
export function checkProblemText(text) {
  const t = normalizeMarkup(text).toLowerCase().replace(/\s+/g, ' ').trim();
  if (t.replace(/[^a-zа-я0-9]/g, '').length < 12) return 'Слишком короткое условие. Напишите задачу полностью: что дано и что нужно найти.';
  if (!/[а-я]{3}/.test(t) || !GEO_WORDS.test(t)) return 'Некорректная задача: это не похоже на условие геометрической задачи. Опишите фигуру, данные и что нужно найти — например, «В треугольнике ABC AB = 5, BC = 7, угол B = 60°. Найдите AC».';
  if (!TASK_WORDS.test(t)) return 'Некорректная задача: не указано, что нужно найти или доказать (добавьте, например, «Найдите AC»).';
  return null;
}

async function solveLocalOrIr(text, opts) {
  const bad = checkProblemText(text);
  if (bad) return { ok: false, invalid: true, error: bad };
  const parsed = parseProblem(text);
  let ir = parsed.ir;
  const notes = [];
  // 1) Сначала всегда — локальный решатель, без нейросети. Нераспознанные обрывки
  //    условия не мешают, если по понятой части ответ находится однозначно.
  if (parsed.ok) {
    let local = null;
    try { validateIr(ir); local = solveIr(ir, Object.assign({}, opts, { source: 'local', notes: [], partial: parsed.unknown.length ? parsed.unknown : null })); } catch (e) { local = null; }
    // Искомое совпадает с данным — значит, условие понято неверно (например, «третью сторону»).
    const sameAsGiven = ir.find.some(f => ir.given.some(g => g.kind === f.kind && ((f.seg && g.seg && f.seg.split('').sort().join('') === g.seg.split('').sort().join('')) || (f.angle && g.angle === f.angle) || ((f.kind === 'area' || f.kind === 'perimeter') && (f.of || null) === (g.of || null)))));
    if (sameAsGiven) local = Object.assign({}, local, { ok: false, error: 'Не удалось понять, что нужно найти.' });
    const clean = local && local.ok && local.method !== 'coords' && !local.undetermined;
    const leftoverData = parsed.unknown.some(u => /\d/.test(u));
    if (clean && (!leftoverData || !opts.ai)) {
      if (parsed.unknown.length && leftoverData) local.notes.unshift('Часть условия не распознана: «' + parsed.unknown.join('», «') + '». Проверьте, что решение учитывает всё условие.');
      return local;
    }
    if (local && local.ok && !opts.ai) return local;
  }
  // 2) Редкий случай: формулировку разбирает нейросеть (результат решает всё равно
  //    локальный решатель — с чертежом и шагами).
  if (opts.ai) {
    try {
      ir = validateIr(await opts.ai(text, parsed.ir, parsed.unknown));
      ir.text = parsed.ir.text;
      const r = solveIr(ir, Object.assign({}, opts, { source: 'ai', notes }));
      if (r.ok && r.method !== 'coords') return r;
    } catch (e) { /* дальше — полное решение нейросетью */ }
  }
  if (!parsed.ok) return { ok: false, error: 'Не удалось понять условие задачи: решатель знает треугольники, параллелограммы, ромбы, прямоугольники, квадраты и трапеции (с биссектрисами, медианами, высотами, диагоналями), вписанную и описанную окружности, касательные.', ir, parsed };
  try { validateIr(ir); } catch (e) { return { ok: false, error: 'Условие неполное: ' + e.message + '.', ir, parsed }; }
  return solveIr(ir, Object.assign({}, opts, { source: 'local', notes, partial: parsed.unknown.length ? parsed.unknown : null }));
}

export function solveIr(ir, opts) {
  try { return solveIrUnsafe(ir, opts); } catch (e) {
    return { ok: false, error: 'Решатель не справился с этой задачей (' + (e && e.message ? e.message : e) + ').', ir };
  }
}
function solveIrUnsafe(ir, opts) {
  opts = opts || {};
  const notes = (opts.notes || []).slice();
  let model;
  try { model = buildModel(ir); } catch (e) { return { ok: false, error: 'Не удалось построить чертёж: ' + e.message, ir }; }
  if (!model.consistent) {
    return { ok: false, error: 'Данные задачи противоречат друг другу: такой фигуры не существует (или условие распознано неверно). Проверьте числа в условии.', ir };
  }
  // Искомое «sin A» → угол A (значение пересчитаем в конце); «большая/меньшая
  // сторона, диагональ», «угол ромба» — выбираем по построенной модели.
  const trigFinds = [];
  ir.find = ir.find.map(f => {
    if (f.pick) {
      const V = ir.figure.vertices;
      const sides = V.map((v, i) => (i === V.length - 1 ? V[0] + v : v + V[i + 1]));
      const L = sg => evalQ(model, { kind: 'length', seg: sg });
      if (f.pick === 'max' || f.pick === 'min') { const arr = sides.slice().sort((a, b) => L(a) - L(b)); return { kind: 'length', seg: f.pick === 'max' ? arr[arr.length - 1] : arr[0] }; }
      if (f.pick === 'maxDiag' || f.pick === 'minDiag') { const d = [V[0] + V[2], V[1] + V[3]].sort((a, b) => L(a) - L(b)); return { kind: 'length', seg: f.pick === 'maxDiag' ? d[1] : d[0] }; }
      if (f.pick === 'acute') { const a = evalQ(model, { kind: 'angle', angle: V[0] }); return { kind: 'angle', angle: a <= 90 + 1e-9 ? V[0] : V[1] }; }
    }
    return f;
  });
  // Недостающие данные: выбираем «средние» значения и достраиваем модель для чертежа.
  const undetermined = ir.find.filter(f => { try { return !isDetermined(model, f); } catch (e) { return true; } });
  const assumed = assumedQuantities(model).map(a => ({ q: a.q, value: niceValue(a.q, a.value) }));
  let drawModel = model;
  if (assumed.length) {
    const ir2 = Object.assign({}, ir, { given: ir.given.concat(assumed.map(a => Object.assign({}, a.q, { value: a.value, assumed: true }))) });
    try { const m2 = buildModel(ir2); if (m2.consistent) drawModel = m2; } catch (e) { /* чертёж по исходной модели */ }
  }
  const assumedText = assumed.length ? 'для чертежа принято ' + assumed.map(a => (a.q.kind === 'angle' ? '∠' + a.q.angle + ' = ' + num(a.value) + '°' : a.q.seg + ' = ' + num(a.value) + (ir.unit ? ' ' + ir.unit : ''))).join(', ') + ' (в условии не задано)' : '';

  // Решение: сначала как есть, затем с дополнительными построениями.
  let sol = solveProblem(ir, drawModel);
  let usedIr = ir, auxUsed = null;
  if (sol.method === 'coords') {
    for (const aux of auxCandidates(ir)) {
      const ir3 = Object.assign({}, ir, { constructions: ir.constructions.concat(aux) });
      const drawIr = Object.assign({}, ir3, { given: ir3.given.concat(assumed.map(a => Object.assign({}, a.q, { value: a.value, assumed: true }))) });
      let m3;
      try { m3 = buildModel(assumed.length ? drawIr : ir3); } catch (e) { continue; }
      if (!m3.consistent) continue;
      const s3 = solveProblem(ir3, m3);
      if (s3.method !== 'coords') { sol = s3; usedIr = ir3; drawModel = m3; auxUsed = aux; break; }
    }
  }
  let steps = sol.steps, answers = sol.answers, method = sol.method;
  if (auxUsed) steps = [{ html: italicNames(auxText(auxUsed)), kind: 'aux' }].concat(steps);
  if (method === 'coords') {
    const cs = coordinateSolution(ir, drawModel, ir.find, evalQ);
    steps = cs.steps; answers = cs.answers;
  }
  if (undetermined.length && opts.partial) {
    // Условие понято не полностью, и ответа по понятой части не найти — не выдаём
    // «решение» по придуманным значениям.
    return { ok: false, error: 'Не удалось полностью понять условие (' + opts.partial.join('; ') + '), а по понятой части ответ однозначно не находится. Попробуйте переформулировать задачу.', ir };
  }
  if (undetermined.length) {
    notes.push('Данных в условии недостаточно, чтобы однозначно найти ' + undetermined.map(f => RU_Q[f.kind] + (f.seg ? ' ' + f.seg : f.angle ? ' ' + f.angle : '')).join(', ') + ': ответ зависит от величин, которых нет в условии. Решение дано для чертежа, где ' + assumedText.replace(/^для чертежа принято /, '').replace(/ \(в условии не задано\)$/, '') + '.');
  }
  // «сумма углов B и C»
  const grp = answers.filter(a => a.f && a.f.sumGroup);
  if (grp.length > 1) {
    const total = grp.reduce((t, a) => t + a.value, 0);
    steps.push({ html: grp.map(a => a.name).join(' + ') + ' = ' + grp.map(a => num(a.value) + '°').join(' + ') + ' = <b>' + num(total) + '°</b>.', kind: 'sum' });
    answers = answers.filter(a => !(a.f && a.f.sumGroup)).concat([{ f: grp[0].f, name: grp.map(a => a.name).join(' + '), value: total, unit: '°' }]);
  }
  let gms = '';
  try { gms = buildGms(usedIr, drawModel, sol, { theme: opts.theme, assumedText }); } catch (e) { notes.push('Чертёж не построен: ' + e.message); }
  return { ok: true, ir: usedIr, source: opts.source || 'local', method, steps, answers, gms, notes, model: drawModel, undetermined: undetermined.length > 0 };
}

// Ответ одной строкой (для заголовка): «EF = 6 см».
export function answerText(a) {
  if (a.text) return a.text;
  return a.name + ' = ' + num(a.value) + (a.unit === '°' ? '°' : a.unit ? ' ' + a.unit : '');
}
export { ANG };
