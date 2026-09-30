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
import { buildModel, evalQ, isDetermined, assumedQuantities } from './geo-model.js';
import { solveProblem, coordinateSolution, num, I, ANG, italicNames } from './geo-reason.js';
import { buildGms } from './geo-gms.js';

const FIG_TYPES = ['triangle', 'parallelogram', 'rhombus', 'rectangle', 'square', 'trapezoid', 'quadrilateral'];
const RU_Q = { length: 'отрезок', angle: 'угол', area: 'площадь', perimeter: 'периметр' };

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
    return false;
  });
  ir.constructions = (ir.constructions || []).filter(c => c && typeof c === 'object' && typeof c.kind === 'string');
  ir.find = (ir.find || []).filter(f => f && ['length', 'angle', 'area', 'perimeter'].includes(f.kind));
  if (!ir.find.length) throw new Error('не понятно, что нужно найти');
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
    const h1 = { kind: 'altitude', vertex: top[0], target: bottom, point: nameFor('H'), aux: true };
    out.push([h1]);
    const h2 = { kind: 'altitude', vertex: top[1], target: bottom, point: freeName({ constructions: ir.constructions.concat([h1]), given: ir.given }, V, 'K'), aux: true };
    out.push([h1, h2]);
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

export async function solveGeometryProblem(text, opts) {
  opts = opts || {};
  const parsed = parseProblem(text);
  let ir = parsed.ir;
  let source = 'local';
  const notes = [];
  let partial = null;
  const needAi = !parsed.ok || parsed.unknown.length > 0;
  if (needAi) {
    if (!opts.ai) {
      if (!parsed.ok) return { ok: false, error: 'Не удалось понять условие задачи. Проверьте, что указаны фигура с обозначениями вершин (например, «в параллелограмме ABCD») и что нужно найти.', ir, parsed };
      notes.push('Часть условия не распознана: «' + parsed.unknown.join('», «') + '». Решение построено по остальным данным.');
      partial = parsed.unknown;
    } else {
      try {
        const aiIr = await opts.ai(text, parsed.ir, parsed.unknown);
        ir = validateIr(aiIr);
        ir.text = parsed.ir.text;
        source = 'ai';
      } catch (e) {
        if (!parsed.ok) return { ok: false, error: 'Не удалось разобрать условие: ' + (e && e.message ? e.message : e), ir, parsed };
        notes.push('Часть условия не распознана («' + parsed.unknown.join('», «') + '»), а нейросеть недоступна: решение построено по остальным данным.');
        partial = parsed.unknown;
      }
    }
  }
  try { validateIr(ir); } catch (e) { return { ok: false, error: 'Условие неполное: ' + e.message + '.', ir, parsed }; }
  return solveIr(ir, Object.assign({}, opts, { source, notes, partial }));
}

export function solveIr(ir, opts) {
  opts = opts || {};
  const notes = (opts.notes || []).slice();
  let model;
  try { model = buildModel(ir); } catch (e) { return { ok: false, error: 'Не удалось построить чертёж: ' + e.message, ir }; }
  if (!model.consistent) {
    return { ok: false, error: 'Данные задачи противоречат друг другу: такой фигуры не существует (или условие распознано неверно). Проверьте числа в условии.', ir };
  }
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
  let gms = '';
  try { gms = buildGms(usedIr, drawModel, sol, { theme: opts.theme, assumedText }); } catch (e) { notes.push('Чертёж не построен: ' + e.message); }
  return { ok: true, ir: usedIr, source: opts.source || 'local', method, steps, answers, gms, notes, model: drawModel };
}

// Ответ одной строкой (для заголовка): «EF = 6 см».
export function answerText(a) {
  return a.name + ' = ' + num(a.value) + (a.unit === '°' ? '°' : a.unit ? ' ' + a.unit : '');
}
export { ANG };
