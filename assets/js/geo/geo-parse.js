// assets/js/geo/geo-parse.js
// Разбор текста геометрической задачи (по-русски) в структурированное условие —
// «IR», общий формат для всего решателя (geo-model / geo-reason / geo-gms):
//
//   {
//     figure: { type, vertices: ['A','B','C','D'], rightAngle?, base?, bases? },
//     given:  [ { kind: 'length', seg: 'AD', value: 12 },
//               { kind: 'angle', angle: 'ABC' | 'A', value: 60 },       // градусы
//               { kind: 'perimeter', of: 'ABCD', value }, { kind: 'area', of, value },
//               { kind: 'ratio', segs: ['AB','BC'], ratio: [2, 3] },
//               { kind: 'mult', a: 'BC', b: 'AB', k: 2 },               // a = k·b
//               { kind: 'diff', a: 'BC', b: 'AB', value: 3 },           // a − b = value
//               { kind: 'onLine', point: 'O', seg: 'BC' } ],
//     constructions: [ { kind: 'bisector', vertex: 'B', angle?: 'ABC', target: 'AD', point: 'E' },
//                      { kind: 'median' | 'altitude', vertex, target, point },
//                      { kind: 'midpoint', seg, point }, { kind: 'segment', seg },
//                      { kind: 'intersection', point, lines: ['AC','BD'] },
//                      { kind: 'pointOn', point, seg } ],
//     find:   [ { kind: 'length', seg } | { kind: 'angle', angle } |
//               { kind: 'area', of? } | { kind: 'perimeter', of? } ],
//     unit: 'см'
//   }
//
// Разбор — набор шаблонов формулировок. Каждый шаблон «съедает» свой фрагмент
// текста; если после всех шаблонов в тексте остались обозначения точек или числа,
// которые ни один шаблон не понял, результат помечается как неполный
// (unknown: [...]) — тогда вызывающий код отправляет задачу ИИ (geo-ai.js).

import { normalizeMarkup } from './geo-markup.js';

// Кириллические буквы, похожие на латинские: ученики часто набирают «АВС» русскими.
const CYR2LAT = { 'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X', 'У': 'Y' };

const NUM = '(\\d+(?:[.,]\\d+)?\\s*√\\s*\\d+(?:[.,]\\d+)?|√\\s*\\d+(?:[.,]\\d+)?|\\d+(?:[.,]\\d+)?(?:\\s*\\/\\s*\\d+)?)';
const UNIT = '(?:\\s*(см|мм|дм|км|м)(?![а-яА-Я])\\.?)?';
const DEG = '\\s*(?:°|º|градус[а-яА-Я]*|грд\\.?)?';
const EQ = '\\s*(?:=|равен|равн[а-яА-Я]*|составляет|—)\\s*';
const SEG = '([A-Z][0-9]?[A-Z][0-9]?)';
const EQS = '\\s*(?:=|равен|равн[а-яА-Я]*|составляет|—|:)?\\s*';   // «периметр ромба 52»

export function parseNumber(s) {
  s = String(s).replace(/\s+/g, '').replace(',', '.');
  let m;
  if ((m = s.match(/^(\d+(?:\.\d+)?)?√(\d+(?:\.\d+)?)$/))) return (m[1] ? parseFloat(m[1]) : 1) * Math.sqrt(parseFloat(m[2]));
  if ((m = s.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/))) return parseFloat(m[1]) / parseFloat(m[2]);
  return parseFloat(s);
}

// Текст → удобный для шаблонов вид: ё → е, кириллические «точки» → латиница,
// ∠ ABC → ∠ABC, единый пробел, «угол B» в любом регистре.
export function normalizeText(src) {
  let t = normalizeMarkup(src).replace(/\r/g, '').replace(/ё/g, 'е').replace(/Ё/g, 'Е');
  t = t.replace(/[−–]/g, '-').replace(/ /g, ' ').replace(/[“”«»]/g, '"');
  t = t.replace(/\bsqrt\s*\(?\s*(\d+(?:[.,]\d+)?)\s*\)?/gi, '√$1').replace(/√\s*\(\s*(\d+(?:[.,]\d+)?)\s*\)/g, '√$1');
  // Отдельно стоящие «слова» из 1–5 заглавных букв (с цифрами-индексами) — это
  // обозначения точек: переводим их в латиницу. Исключение — однобуквенный предлог
  // в начале предложения («В треугольнике…», «К стороне…»).
  t = t.replace(/(^|[^А-Яа-яA-Za-z])([А-ЯA-Z][А-ЯA-Z0-9]{0,5})(?=$|[^А-Яа-яA-Za-z])/g, (all, pre, tok, off) => {
    if (!/[А-Я]/.test(tok) || ![...tok].every(ch => CYR2LAT[ch] || /[A-Z0-9]/.test(ch))) return all;
    const before = t.slice(0, off + pre.length);
    const after = t.slice(off + all.length);
    if (tok.length === 1 && /(^|[.!?\n]\s*)$/.test(before) && /^\s+[а-я]/.test(after)) return all;
    return pre + [...tok].map(ch => CYR2LAT[ch] || ch).join('');
  });
  // Кириллица — в нижний регистр (обозначения уже латиницей): шаблонам не нужен регистр.
  t = t.replace(/[А-Я]/g, ch => ch.toLowerCase());
  t = t.replace(/[△∆]\s*([A-Z]{3})/g, 'треугольник $1');
  t = t.replace(/∠\s*/g, '∠').replace(/\s*=\s*/g, ' = ').replace(/[ \t]+/g, ' ');
  return t.trim();
}

function segKey(s) { return s; }
function uniq(a) { return Array.from(new Set(a)); }

const FIGURE_PATTERNS = [
  // порядок важен: сначала более специфичные
  { re: /равнобедренн[а-яА-Я]*\s+прямоугольн[а-яА-Я]*\s+треугольник[а-яА-Я]*\s+([A-Z]{3})/, type: 'triangle', props: { isoRight: true } },
  { re: /прямоугольн(?:ый|ом|ого|ому|ым)\s+треугольник[а-яА-Я]*\s+([A-Z]{3})/, type: 'triangle', props: { right: true } },
  { re: /равнобедренн[а-яА-Я]*\s+треугольник[а-яА-Я]*\s+([A-Z]{3})/, type: 'triangle', props: { isosceles: true } },
  { re: /(?:равносторонн|правильн)[а-яА-Я]*\s+треугольник[а-яА-Я]*\s+([A-Z]{3})/, type: 'triangle', props: { equilateral: true } },
  { re: /треугольник[а-яА-Я]*\s+([A-Z]{3})\b/, type: 'triangle' },
  { re: /параллелограмм[а-яА-Я]*\s+([A-Z]{4})/, type: 'parallelogram' },
  { re: /ромб[а-яА-Я]*\s+([A-Z]{4})/, type: 'rhombus' },
  { re: /прямоугольник[а-яА-Я]*\s+([A-Z]{4})/, type: 'rectangle' },
  { re: /квадрат[а-яА-Я]*\s+([A-Z]{4})/, type: 'square' },
  { re: /равнобедренн[а-яА-Я]*\s+трапеци[а-яА-Я]*\s+([A-Z]{4})/, type: 'trapezoid', props: { isosceles: true } },
  { re: /(?:равнобочн)[а-яА-Я]*\s+трапеци[а-яА-Я]*\s+([A-Z]{4})/, type: 'trapezoid', props: { isosceles: true } },
  { re: /прямоугольн[а-яА-Я]*\s+трапеци[а-яА-Я]*\s+([A-Z]{4})/, type: 'trapezoid', props: { rightTrap: true } },
  { re: /трапеци[а-яА-Я]*\s+([A-Z]{4})/, type: 'trapezoid' },
  { re: /(?:выпукл[а-яА-Я]*\s+)?четырехугольник[а-яА-Я]*\s+([A-Z]{4})/, type: 'quadrilateral' },
];

// Именованная фигура без букв («стороны параллелограмма равны 5 и 7»).
const FIGURE_WORDS = [
  { re: /прямоугольн(?:ый|ом|ого|ому|ым)\s+треугольник/, type: 'triangle', props: { right: true } },
  { re: /равнобедренн[а-яА-Я]*\s+треугольник/, type: 'triangle', props: { isosceles: true } },
  { re: /равносторонн[а-яА-Я]*\s+треугольник/, type: 'triangle', props: { equilateral: true } },
  { re: /треугольник/, type: 'triangle' },
  { re: /параллелограмм/, type: 'parallelogram' },
  { re: /ромб/, type: 'rhombus' },
  { re: /прямоугольник/, type: 'rectangle' },
  { re: /квадрат/, type: 'square' },
  { re: /равнобедренн[а-яА-Я]*\s+трапеци/, type: 'trapezoid', props: { isosceles: true } },
  { re: /трапеци/, type: 'trapezoid' },
];

export function parseProblem(src) {
  const text = normalizeText(src);
  // mask — копия текста, в которой понятые фрагменты затираются пробелами.
  let mask = text;
  const eat = (idx, len) => { mask = mask.slice(0, idx) + ' '.repeat(len) + mask.slice(idx + len); };
  // Применяет шаблон ко всему тексту (по маске — чтобы не разобрать одно и то же дважды).
  const each = (re, fn) => {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    const found = [];
    while ((m = g.exec(mask))) { found.push({ m, idx: m.index }); if (m[0].length === 0) g.lastIndex++; }
    for (const f of found) {
      if (fn(f.m) !== false) eat(f.idx, f.m[0].length);
    }
  };

  const ir = { figure: null, given: [], constructions: [], find: [], unit: '', text: String(src || '').trim() };
  const u = text.match(/\d\s*(см|мм|дм|км|м)(?![а-яА-Я])/);
  if (u) ir.unit = u[1];

  // ---------- фигура ----------
  for (const p of FIGURE_PATTERNS) {
    const m = mask.match(p.re);
    if (m) {
      ir.figure = Object.assign({ type: p.type, vertices: m[1].split('') }, p.props || {});
      eat(m.index, m[0].length);
      break;
    }
  }
  if (!ir.figure) {
    for (const p of FIGURE_WORDS) {
      const m = mask.match(p.re);
      if (m) {
        const n = p.type === 'triangle' ? 3 : 4;
        ir.figure = Object.assign({ type: p.type, vertices: 'ABCD'.slice(0, n).split(''), implicitNames: true }, p.props || {});
        break;
      }
    }
  }
  const fig = ir.figure;
  const V = fig ? fig.vertices : [];
  const isVertex = x => V.includes(x);
  const sideOf = (a, b) => {
    // сторона фигуры, соединяющая две соседние вершины
    const n = V.length, i = V.indexOf(a), j = V.indexOf(b);
    return i >= 0 && j >= 0 && (Math.abs(i - j) === 1 || Math.abs(i - j) === n - 1);
  };

  // ---------- уточнения фигуры ----------
  if (fig) {
    each(/(?:с\s+)?прям[а-яА-Я]*\s+угл[а-яА-Я]*\s+(?:при\s+вершине\s+|в\s+вершине\s+)?([A-Z])\b/, m => { if (!isVertex(m[1])) return false; fig.rightAngle = m[1]; if (fig.type === 'triangle') fig.right = true; });
    each(/угол\s+([A-Z])\s+(?:—\s*)?прямой/, m => { if (!isVertex(m[1])) return false; fig.rightAngle = m[1]; if (fig.type === 'triangle') fig.right = true; });
    each(/(?:с\s+)?основани(?:ем|е)\s+([A-Z]{2})\b(?!\s+и\s+[A-Z]{2})/, m => { fig.base = m[1]; });
    each(/(?:с\s+)?основаниями\s+([A-Z]{2})\s+и\s+([A-Z]{2})/, m => { fig.bases = [m[1], m[2]]; });
    each(/основани[а-яА-Я]*\s+([A-Z]{2})\s+и\s+([A-Z]{2})(?!\s*(?:=|равн))/, m => { fig.bases = [m[1], m[2]]; });
    each(/гипотенуз[а-яА-Я]*\s+([A-Z]{2})\b(?!\s*(?:=|равн))/, m => {
      const other = V.find(x => !m[1].includes(x)); if (!other) return false; fig.rightAngle = other; fig.right = true;
    });
  }

  // ---------- построения ----------
  const addCons = c => { ir.constructions.push(c); };
  // «Биссектрисы углов B и C пересекают сторону AD в точках E и F (соответственно)»
  each(/биссектрис[а-яА-Я]*\s+угл[а-яА-Я]*\s+([A-Z])(?:\s*,\s*([A-Z]))?(?:\s+и\s+([A-Z]))?(?:\s+[а-яА-Я]+)*?\s+(?:пересека[а-яА-Я]*|дел[а-яА-Я]*|отсека[а-яА-Я]*|встреча[а-яА-Я]*|падают\s+на|проходят\s+через)?\s*(?:(?<![а-я])сторон[а-яА-Я]*|основани[а-яА-Я]*|отрез[а-яА-Я]*|прям[а-яА-Я]*|продолжени[а-яА-Я]*\s+(?<![а-я])сторон[а-яА-Я]*)\s+([A-Z]{2})\s+в\s+точк[а-яА-Я]*\s+([A-Z])(?:\s*(?:,|и)\s*([A-Z]))?(?:\s*(?:,|и)\s*([A-Z]))?(?:\s*,?\s*соответственно)?/, m => {
    const verts = [m[1], m[2], m[3]].filter(Boolean);
    const pts = [m[5], m[6], m[7]].filter(Boolean);
    if (pts.length !== verts.length) return false;
    verts.forEach((v, i) => addCons({ kind: 'bisector', vertex: v, target: m[4], point: pts[i] }));
  });
  // «Биссектриса угла A пересекает сторону BC в точке K» / «…угла BAD…»
  each(/биссектрис[а-яА-Я]*\s+(?:угл[а-яА-Я]*\s+)?(?:∠)?([A-Z]{1,3})(?:\s+[а-яА-Я]+)*?\s+(?:пересека[а-яА-Я]*|дел[а-яА-Я]*|отсека[а-яА-Я]*)\s+(?:(?<![а-я])сторон[а-яА-Я]*|основани[а-яА-Я]*|отрез[а-яА-Я]*|прям[а-яА-Я]*)?\s*([A-Z]{2})\s+в\s+точк[а-яА-Я]*\s+([A-Z])/, m => {
    const a = m[1];
    addCons({ kind: 'bisector', vertex: a.length === 3 ? a[1] : a[0], angle: a.length === 3 ? a : undefined, target: m[2], point: m[3] });
  });
  // «Биссектриса угла A делит сторону BC на отрезки BK = 4 и KC = 3» / «…на отрезки 4 и 3, считая от вершины B»
  const RE_DIVIDES = new RegExp(/биссектрис[а-яА-Я]*\s+(?:угл[а-яА-Я]*\s+)?([A-Z])\s+(?:[а-яА-Я]+\s+)*?дел[а-яА-Я]*\s+(?<![а-я])сторон[а-яА-Я]*\s+([A-Z]{2})\s+на\s+отрезки\s+(?:([A-Z]{2})\s*=\s*)?NUM(?:\s*(?:см|мм|дм|м))?\s+и\s+(?:([A-Z]{2})\s*=\s*)?NUM(?:\s*(?:см|мм|дм|м))?(?:\s*,?\s*считая\s+от\s+(?:вершины|точки)\s+([A-Z]))?/.source.replace(/NUM/g, NUM));
  each(RE_DIVIDES, m => {
    const vert = m[1], side = m[2];
    let p = null;
    if (m[3]) p = m[3].replace(side[0], '').replace(side[1], '');
    if (!p || p.length !== 1) p = freeName(ir, V, 'K');
    const from = m[7] && side.includes(m[7]) ? m[7] : (m[3] && side.includes(m[3][0]) && m[3][0] !== p ? m[3][0] : side[0]);
    const to = side.replace(from, '');
    addCons({ kind: 'bisector', vertex: vert, target: side, point: p });
    ir.given.push({ kind: 'length', seg: from + p, value: parseNumber(m[4]) });
    ir.given.push({ kind: 'length', seg: p + to, value: parseNumber(m[6]) });
  });
  // «проведена биссектриса AK», «AK — биссектриса»
  const lineCons = (kindRe, kind) => {
    each(new RegExp('(?:проведен[а-яА-Я]*\\s+)?' + kindRe + '\\s+' + SEG + '(?:\\s+(?:к|на)\\s+(?:(?<![а-я])сторон[а-яА-Я]*|основани[а-яА-Я]*|прям[а-яА-Я]*|гипотенуз[а-яА-Я]*)?\\s*([A-Z]{2}))?(?:' + EQ + NUM + UNIT + ')?'), m => {
      const s = m[1]; const t = m[2];
      if (m[3]) ir.given.push({ kind: 'length', seg: s, value: parseNumber(m[3]) });
      if (s.length !== 2) return false;
      let vert = isVertex(s[0]) ? s[0] : (isVertex(s[1]) ? s[1] : null);
      if (!vert) return false;
      const pt = s.replace(vert, '');
      if (isVertex(pt) && kind !== 'segment') return false;
      addCons({ kind, vertex: vert, target: t || null, point: pt });
    });
    each(new RegExp(SEG + '\\s*(?:—|-|является)\\s*' + kindRe), m => {
      const s = m[1];
      let vert = isVertex(s[0]) ? s[0] : (isVertex(s[1]) ? s[1] : null);
      if (!vert) return false;
      addCons({ kind, vertex: vert, target: null, point: s.replace(vert, '') });
    });
  };
  lineCons('биссектрис[а-яА-Я]*', 'bisector');
  lineCons('медиан[а-яА-Я]*', 'median');
  lineCons('высот[а-яА-Я]*', 'altitude');
  // «из вершины B проведена высота/биссектриса/медиана к стороне AD» без имени точки
  each(/из\s+вершины\s+([A-Z])\s+(?:проведен[а-яА-Я]*|опущен[а-яА-Я]*)\s+(высот[а-яА-Я]*|биссектрис[а-яА-Я]*|медиан[а-яА-Я]*|перпендикуляр[а-яА-Я]*)\s+([A-Z]{2})?\s*(?:к|на)\s+(?:(?<![а-я])сторон[а-яА-Я]*|основани[а-яА-Я]*|прям[а-яА-Я]*)?\s*([A-Z]{2})/, m => {
    const kind = /высот|перпенд/.test(m[2]) ? 'altitude' : /биссектр/.test(m[2]) ? 'bisector' : 'median';
    const pt = m[3] ? m[3].replace(m[1], '') : freeName(ir, V, kind === 'altitude' ? 'H' : kind === 'median' ? 'M' : 'L');
    addCons({ kind, vertex: m[1], target: m[4], point: pt });
  });
  // «из вершины C опущена высота CD» (без стороны — её найдёт resolveTargets)
  each(/из\s+вершины\s+([A-Z])\s+(?:проведен[а-яА-Я]*|опущен[а-яА-Я]*)(?=\s*(?:$|[.,;]|\s{3,}|\s+(?:высот|медиан|биссектрис|перпендикуляр)))/, () => {});
  // «перпендикуляр BH к стороне AD»
  each(/перпендикуляр[а-яА-Я]*\s+([A-Z]{2})\s+(?:к|на)\s+(?:(?<![а-я])сторон[а-яА-Я]*|основани[а-яА-Я]*|прям[а-яА-Я]*)?\s*([A-Z]{2})/, m => {
    const s = m[1]; const vert = isVertex(s[0]) ? s[0] : s[1];
    addCons({ kind: 'altitude', vertex: vert, target: m[2], point: s.replace(vert, '') });
  });
  // середины
  each(/точк[а-яА-Я]*\s+([A-Z])\s+и\s+([A-Z])\s*(?:—|-|являются)\s*середин[а-яА-Я]*\s+(?:сторон\s+|отрезков\s+)?([A-Z]{2})\s+и\s+([A-Z]{2})(?:\s+соответственно)?/, m => {
    addCons({ kind: 'midpoint', seg: m[3], point: m[1] });
    addCons({ kind: 'midpoint', seg: m[4], point: m[2] });
  });
  each(/(?:точк[а-яА-Я]*\s+)?([A-Z])\s*(?:—|-|является)\s*середин[а-яА-Я]*\s+(?:(?<![а-я])сторон[а-яА-Я]*\s+|отрезк[а-яА-Я]*\s+|основани[а-яА-Я]*\s+|гипотенуз[а-яА-Я]*\s+|диагонал[а-яА-Я]*\s+)?([A-Z]{2})/, m => { addCons({ kind: 'midpoint', seg: m[2], point: m[1] }); });
  each(/середин[а-яА-Я]*\s+(?:(?<![а-я])сторон[а-яА-Я]*\s+|отрезк[а-яА-Я]*\s+)?([A-Z]{2})\s*(?:—|-)?\s*точк[а-яА-Я]*\s+([A-Z])/, m => { addCons({ kind: 'midpoint', seg: m[1], point: m[2] }); });
  // диагонали
  each(/диагонал[а-яА-Я]*\s+([A-Z]{2})\s+и\s+([A-Z]{2})(?:\s+[а-яА-Я]+)*?\s+пересека[а-яА-Я]*\s+в\s+точк[а-яА-Я]*\s+([A-Z])/, m => { addCons({ kind: 'intersection', lines: [m[1], m[2]], point: m[3] }); });
  each(/диагонал[а-яА-Я]*(?:\s+[а-яА-Я]+)*?\s+пересека[а-яА-Я]*\s+в\s+точк[а-яА-Я]*\s+([A-Z])/, m => {
    if (V.length !== 4) return false;
    addCons({ kind: 'intersection', lines: [V[0] + V[2], V[1] + V[3]], point: m[1] });
  });
  // «отрезки AM и BK пересекаются в точке O»
  each(/(?:отрезк[а-яА-Я]*|прям[а-яА-Я]*)\s+([A-Z]{2})\s+и\s+([A-Z]{2})\s+пересека[а-яА-Я]*\s+в\s+точк[а-яА-Я]*\s+([A-Z])/, m => { addCons({ kind: 'intersection', lines: [m[1], m[2]], point: m[3] }); });
  // «биссектрисы углов A и B пересекаются в точке O»
  each(/биссектрис[а-яА-Я]*\s+угл[а-яА-Я]*\s+([A-Z])\s+и\s+([A-Z])\s+пересека[а-яА-Я]*\s+в\s+точк[а-яА-Я]*\s+([A-Z])(?:\s*,?\s*(?:лежащей|принадлежащей)\s+(?:(?<![а-я])сторон[а-яА-Я]*|основани[а-яА-Я]*)\s+([A-Z]{2}))?/, m => {
    addCons({ kind: 'bisectorMeet', vertices: [m[1], m[2]], point: m[3] });
    if (m[4]) ir.given.push({ kind: 'onLine', point: m[3], seg: m[4] });
  });
  // точка на стороне
  each(/(?:на\s+(?<![а-я])сторон[а-яА-Я]*|на\s+основани[а-яА-Я]*|на\s+отрезк[а-яА-Я]*|на\s+диагонал[а-яА-Я]*)\s+([A-Z]{2})\s+(?:[а-яА-Я]+\s+)?(?:взят[а-яА-Я]*|отмечен[а-яА-Я]*|выбран[а-яА-Я]*|лежит|дана)?\s*точк[а-яА-Я]*\s+([A-Z])/, m => { addCons({ kind: 'pointOn', seg: m[1], point: m[2] }); });
  each(/точк[а-яА-Я]*\s+([A-Z])\s+(?:лежит|взята|отмечена|выбрана|расположена)\s+на\s+(?:(?<![а-я])сторон[а-яА-Я]*|основани[а-яА-Я]*|отрезк[а-яА-Я]*|диагонал[а-яА-Я]*)\s+([A-Z]{2})/, m => { addCons({ kind: 'pointOn', seg: m[2], point: m[1] }); });
  // проведён отрезок / диагональ
  each(/(?:проведен[а-яА-Я]*|провели|соединили|построен[а-яА-Я]*)\s+(?:диагонал[а-яА-Я]*|отрез[а-яА-Я]*|средн[а-яА-Я]*\s+лини[а-яА-Я]*)\s+([A-Z]{2})(?:\s+и\s+([A-Z]{2}))?/, m => { addCons({ kind: 'segment', seg: m[1] }); if (m[2]) addCons({ kind: 'segment', seg: m[2] }); });

  // ---------- данные ----------
  // «с основаниями 5 и 11 (и высотой 4)»
  each(new RegExp('с\\s+основаниями\\s+' + NUM + UNIT + '\\s+и\\s+' + NUM + UNIT + '(?:\\s*,?\\s*(?:и\\s+)?(?:с\\s+)?высот[а-я]*\\s+' + NUM + UNIT + ')?'), m => {
    if (!fig || fig.type !== 'trapezoid') return false;
    const bs = trapBases(fig); const a = parseNumber(m[1]), b = parseNumber(m[3]);
    ir.given.push({ kind: 'length', seg: bs[0], value: Math.max(a, b) });
    ir.given.push({ kind: 'length', seg: bs[1], value: Math.min(a, b) });
    if (m[5]) { const c = defaultAltitude(ir, V); ir.given.push({ kind: 'length', seg: c.vertex + c.point, value: parseNumber(m[5]) }); }
  });
  // «сторона треугольника равна 16, а высота, проведённая к ней, равна 5»; «высота, проведённая к основанию, равна 6»
  each(new RegExp('(?:(?<![а-я])сторон[а-я]*(?:\\s+[а-я]+){0,2}' + EQ + NUM + UNIT + '\\s*,?\\s*(?:а\\s+)?)?высот[а-я]*\\s*,?\\s+(?:проведенн|опущенн)[а-я]*\\s+(?:к|на)\\s+(ней|основани[а-я]*|гипотенуз[а-я]*|(?<![а-я])сторон[а-я]*\\s+[A-Z]{2}|больш[а-я]*\\s+(?<![а-я])сторон[а-я]*|меньш[а-я]*\\s+(?<![а-я])сторон[а-я]*)\\s*,?' + EQ + NUM + UNIT), m => {
    if (!fig) return false;
    let target = sideByWord(ir, V, m[3]);
    if (m[1] && /ней/.test(m[3])) { target = V.length === 3 ? V[0] + V[2] : V[0] + V[3]; ir.given.push({ kind: 'length', seg: target, value: parseNumber(m[1]) }); }
    const c = altitudeTo(ir, V, target);
    ir.given.push({ kind: 'length', seg: c.vertex + c.point, value: parseNumber(m[4]) });
  });
  // «AB : BC = 2 : 3», «AB и BC относятся как 2 : 3»
  each(new RegExp(SEG + '\\s*:\\s*' + SEG + '\\s*=\\s*' + NUM + '\\s*:\\s*' + NUM), m => { ir.given.push({ kind: 'ratio', segs: [m[1], m[2]], ratio: [parseNumber(m[3]), parseNumber(m[4])] }); });
  each(new RegExp('(?:(?<![а-я])сторон[а-яА-Я]*\\s+)?' + SEG + '\\s+и\\s+' + SEG + '\\s+относятся\\s+как\\s+' + NUM + '\\s*:\\s*' + NUM), m => { ir.given.push({ kind: 'ratio', segs: [m[1], m[2]], ratio: [parseNumber(m[3]), parseNumber(m[4])] }); });
  // «BC = 2AB», «BC = 2·AB»
  each(new RegExp(SEG + '\\s*=\\s*' + NUM + '\\s*[·*⋅]?\\s*' + SEG + '(?![A-Z])'), m => { ir.given.push({ kind: 'mult', a: m[1], b: m[3], k: parseNumber(m[2]) }); });
  // «AB в 2 раза больше (меньше) BC»
  each(new RegExp(SEG + '\\s+в\\s+' + NUM + '\\s+раза?\\s+(больше|меньше|длиннее|короче)\\s+(?:(?<![а-я])сторон[а-яА-Я]*\\s+|отрезк[а-яА-Я]*\\s+)?' + SEG), m => {
    const k = parseNumber(m[2]); const bigger = /больше|длиннее/.test(m[3]);
    ir.given.push({ kind: 'mult', a: m[1], b: m[4], k: bigger ? k : 1 / k });
  });
  // «AB на 3 см больше (меньше) BC»
  each(new RegExp(SEG + '\\s+на\\s+' + NUM + UNIT + '\\s+(больше|меньше|длиннее|короче)\\s+(?:(?<![а-я])сторон[а-яА-Я]*\\s+|отрезк[а-яА-Я]*\\s+)?' + SEG), m => {
    const v = parseNumber(m[2]); const bigger = /больше|длиннее/.test(m[4]);
    ir.given.push({ kind: 'diff', a: m[1], b: m[5], value: bigger ? v : -v });
  });
  // углы: «∠A = 60°», «угол ABC равен 40 градусам», «∠ABC = 2∠A» не поддерживается (→ ИИ)
  each(new RegExp('(?:∠|угол\\s+|угла\\s+)([A-Z]{1,3})' + EQ + NUM + DEG), m => {
    const a = m[1];
    if (a.length === 2) return false;
    ir.given.push({ kind: 'angle', angle: a, value: parseNumber(m[2]) });
  });
  // «…равны 4 и 6, а угол между ними равен 30°»
  each(new RegExp('угол\\s+между\\s+(?:ними|этими\\s+сторонами|сторонами|сторонами\\s+[A-Z]{2}\\s+и\\s+[A-Z]{2})(?:' + EQ + '|\\s+)' + NUM + DEG), m => {
    if (!fig) return false;
    ir.given.push({ kind: 'angle', angle: V[0], value: parseNumber(m[1]) });
  });
  // «один из углов параллелограмма равен 60°» / «острый угол ... равен»
  each(new RegExp('(?:один\\s+из\\s+углов|острый\\s+угол|тупой\\s+угол|угол\\s+при\\s+основании)(?:\\s+[а-я]+){0,3}' + EQ + NUM + DEG), m => {
    if (!fig) return false;
    const v = parseNumber(m[1]);
    const obtuse = /тупой/.test(m[0]);
    let vert = V[0];
    if (fig.type === 'trapezoid' || (fig.type === 'triangle' && /основани/.test(m[0]))) vert = V[0];
    if ((obtuse && v < 90) || (!obtuse && v > 90 && fig.type !== 'triangle')) vert = V[1];
    if (fig.type === 'triangle' && (fig.right || fig.rightAngle)) { const r = fig.rightAngle || V[2]; vert = V.find(x => x !== r); }
    if (fig.type === 'triangle' && /основани/.test(m[0])) { const b = fig.base || (V[0] + V[2]); vert = b[0]; }
    ir.given.push({ kind: 'angle', angle: vert, value: v });
  });
  // периметр/площадь
  each(new RegExp('периметр[а-яА-Я]*(?:\\s+[а-я]+){0,2}(?:\\s+([A-Z]{3,4}))?' + EQS + NUM + UNIT), m => { ir.given.push({ kind: 'perimeter', of: m[1] || null, value: parseNumber(m[2]) }); });
  each(new RegExp('площад[а-яА-Я]*(?:\\s+[а-я]+){0,2}(?:\\s+([A-Z]{3,4}))?' + EQ + NUM + '(?:\\s*(?:кв\\.?\\s*)?(?:см|мм|дм|м)(?:²|2|\\^2)?\\.?)?'), m => { ir.given.push({ kind: 'area', of: m[1] || null, value: parseNumber(m[2]) }); });
  // «стороны параллелограмма равны 5 и 7», «основания трапеции равны 4 и 10», «катеты равны 3 и 4»
  each(new RegExp('(боков[а-яА-Я]*\\s+(?<![а-я])сторон[а-яА-Я]*|(?<![а-я])сторон[а-яА-Я]*|основани[а-яА-Я]*|катет[а-яА-Я]*|диагонал[а-яА-Я]*)(?:\\s+[а-я]+){0,2}\\s+(?:(?:равен|равн[а-яА-Я]*)\\s+)?' + NUM + UNIT + '\\s+и\\s+' + NUM + UNIT), m => {
    if (!fig) return false;
    const a = parseNumber(m[2]), b = parseNumber(m[4]);
    const w = m[1];
    let segs = null;
    if (/основани/.test(w) && fig.type === 'trapezoid') { const bs = trapBases(fig); segs = [bs[1], bs[0]]; if (a > b) segs = [bs[0], bs[1]]; }
    else if (/катет/.test(w) && fig.type === 'triangle') { const r = fig.rightAngle || V[2]; const others = V.filter(x => x !== r); segs = [others[0] + r, others[1] + r]; fig.rightAngle = r; fig.right = true; }
    else if (/диагонал/.test(w) && V.length === 4) segs = [V[0] + V[2], V[1] + V[3]];
    else if (/сторон/.test(w) && V.length === 4) segs = [V[0] + V[1], V[0] + V[3]];
    else if (/сторон/.test(w) && V.length === 3) segs = [V[0] + V[1], V[0] + V[2]];
    if (!segs) return false;
    ir.given.push({ kind: 'length', seg: segs[0], value: a });
    ir.given.push({ kind: 'length', seg: segs[1], value: b });
  });
  // «треугольник со сторонами 3, 4 и 5», «стороны треугольника равны 5, 6 и 7»
  each(new RegExp('(?:со\\s+сторонами|(?<![а-я])сторон[а-я]*\\s+(?:[а-я]+\\s+)?(?:равны|—))\\s+' + NUM + UNIT + '\\s*,\\s*' + NUM + UNIT + '\\s*,?\\s+и\\s+' + NUM + UNIT), m => {
    if (!fig || fig.type !== 'triangle') return false;
    ir.given.push({ kind: 'length', seg: V[0] + V[1], value: parseNumber(m[1]) });
    ir.given.push({ kind: 'length', seg: V[1] + V[2], value: parseNumber(m[3]) });
    ir.given.push({ kind: 'length', seg: V[0] + V[2], value: parseNumber(m[5]) });
  });
  // «прямоугольный треугольник с катетами 9 и 12», «с гипотенузой 10»
  each(new RegExp('с\\s+катетами\\s+' + NUM + UNIT + '\\s+и\\s+' + NUM + UNIT), m => {
    if (!fig || fig.type !== 'triangle') return false;
    const r = fig.rightAngle || V[2]; fig.rightAngle = r; fig.right = true;
    const o = V.filter(x => x !== r);
    ir.given.push({ kind: 'length', seg: o[0] + r, value: parseNumber(m[1]) });
    ir.given.push({ kind: 'length', seg: o[1] + r, value: parseNumber(m[3]) });
  });
  // «параллелограмм со сторонами 4 и 6 (и углом 30°)»
  each(new RegExp('со\\s+сторонами\\s+' + NUM + UNIT + '\\s+и\\s+' + NUM + UNIT + '(?:\\s*(?:,|и)\\s*(?:углом|острым\\s+углом)(?:\\s+между\\s+ними)?\\s+' + NUM + DEG + ')?'), m => {
    if (!fig || V.length !== 4) return false;
    ir.given.push({ kind: 'length', seg: V[0] + V[1], value: parseNumber(m[1]) });
    ir.given.push({ kind: 'length', seg: V[0] + V[3], value: parseNumber(m[3]) });
    if (m[5]) ir.given.push({ kind: 'angle', angle: V[0], value: parseNumber(m[5]) });
  });
  // «… делит сторону AD на отрезки AH = 6 и HD = 4» — сами отрезки разберёт шаблон длин ниже
  each(/(?:дел[а-я]*|разбивает)\s+(?:(?<![а-я])сторон[а-я]*|основани[а-я]*|гипотенуз[а-я]*|отрезок)\s+[A-Z]{2}\s+на\s+отрезки(?=\s+[A-Z]{2}\s*=)/, () => {});
  // «сторона ромба равна 5», «сторона квадрата 4 см», «гипотенуза равна 10»
  each(new RegExp('(?:а\\s+)?(?:ее\\s+|его\\s+)?(боков[а-яА-Я]*\\s+(?<![а-я])сторон[а-яА-Я]*|(?<![а-я])сторон[а-яА-Я]*|гипотенуз[а-яА-Я]*|основани[а-яА-Я]*|радиус[а-яА-Я]*)(?:\\s+[а-я]+){0,3}' + EQ + NUM + UNIT), m => {
    if (!fig) return false;
    const v = parseNumber(m[2]); const w = m[1];
    if (/гипотенуз/.test(w) && fig.type === 'triangle') {
      const r = fig.rightAngle || V[2]; fig.rightAngle = r; fig.right = true;
      ir.given.push({ kind: 'length', seg: V.filter(x => x !== r).join(''), value: v });
    } else if (/боков/.test(w) && fig.type === 'triangle') {
      const b = fig.base || (V[0] + V[2]); const apex = V.find(x => !b.includes(x));
      ir.given.push({ kind: 'length', seg: b[0] + apex, value: v });
    } else if (/боков/.test(w) && fig.type === 'trapezoid') {
      const bs = trapBases(fig); ir.given.push({ kind: 'length', seg: bs[0][0] + bs[1][0], value: v });
    } else if (/основани/.test(w) && fig.type === 'triangle') {
      ir.given.push({ kind: 'length', seg: fig.base || (V[0] + V[2]), value: v });
    } else if (/сторон/.test(w)) {
      ir.given.push({ kind: 'length', seg: V[0] + V[1], value: v });
    } else return false;
  });
  // «a = 5, b = 6, c = 7» — стороны против вершин A, B, C
  each(new RegExp('(?:^|[^A-Za-z])([abc])\\s*=\\s*' + NUM + UNIT), m => {
    if (!fig || fig.type !== 'triangle') return false;
    const i = 'abc'.indexOf(m[1]); const others = V.filter((_, j) => j !== i);
    ir.given.push({ kind: 'length', seg: others.join(''), value: parseNumber(m[2]) });
  });
  // «cos A = 0.6», «sin B = 0,8», «tg C = 3/4»
  each(new RegExp('(cos|sin|tg|tan)\\s*∠?\\s*([A-Z]{1,3})' + EQ + NUM), m => {
    const v = parseNumber(m[3]); let deg;
    if (m[1] === 'cos') deg = Math.acos(v); else if (m[1] === 'sin') deg = Math.asin(v); else deg = Math.atan(v);
    if (!Number.isFinite(deg)) return false;
    ir.given.push({ kind: 'angle', angle: m[2], value: deg * 180 / Math.PI, trig: m[1] + ' = ' + m[3] });
  });
  // ---- формулировки без обозначений ----
  const legsOf = () => { const r = fig.rightAngle || V[2]; fig.rightAngle = r; fig.right = true; const o = V.filter(x => x !== r); return { r, o }; };
  // «два угла треугольника равны 40° и 65°»
  each(new RegExp('(?:два\\s+)?угл[а-я]*\\s+(?:[а-я]+\\s+){0,2}(?:равны|—)\\s+' + NUM + DEG + '\\s+и\\s+' + NUM + DEG), m => {
    if (!fig) return false;
    ir.given.push({ kind: 'angle', angle: V[0], value: parseNumber(m[1]) });
    ir.given.push({ kind: 'angle', angle: V[1], value: parseNumber(m[2]) });
  });
  // «один из острых углов (прямоугольного треугольника) равен 27°»
  each(new RegExp('один\\s+из\\s+острых\\s+углов(?:\\s+[а-я]+){0,2}' + EQ + NUM + DEG), m => {
    if (!fig || fig.type !== 'triangle') return false;
    const { o } = legsOf(); ir.given.push({ kind: 'angle', angle: o[0], value: parseNumber(m[1]) });
  });
  // «катет равен 7, а противолежащий (прилежащий) ему угол равен 30°»
  each(new RegExp('катет[а-я]*' + EQ + NUM + UNIT + '\\s*,?\\s*(?:а\\s+)?(противолежащ|прилежащ)[а-я]*\\s+(?:ему\\s+)?(?:острый\\s+)?угол' + EQ + NUM + DEG), m => {
    if (!fig || fig.type !== 'triangle') return false;
    const { r, o } = legsOf();
    // катет BC (= o[1] r) противолежит углу o[0]
    ir.given.push({ kind: 'length', seg: o[1] + r, value: parseNumber(m[1]) });
    ir.given.push({ kind: 'angle', angle: /противолеж/.test(m[3]) ? o[0] : o[1], value: parseNumber(m[4]) });
  });
  // «гипотенуза равна 25, один из катетов равен 7», «катет равен 7»
  each(new RegExp('(?:один\\s+из\\s+катетов|(?<![а-я])катет[а-я]*(?:\\s+(?:прямоугольного|этого|данного)\\s+треугольника)?)' + EQ + NUM + UNIT), m => {
    if (!fig || fig.type !== 'triangle') return false;
    const { r, o } = legsOf(); ir.given.push({ kind: 'length', seg: o[0] + r, value: parseNumber(m[1]) });
  });
  // «с гипотенузой 26», «со стороной 7», «с основанием 10»
  each(new RegExp('с\\s+гипотенуз[а-я]*\\s+' + NUM + UNIT), m => {
    if (!fig || fig.type !== 'triangle') return false;
    const { o } = legsOf(); ir.given.push({ kind: 'length', seg: o.join(''), value: parseNumber(m[1]) });
  });
  each(new RegExp('со\\s+сторон(?:ой|ою)\\s+' + NUM + UNIT), m => {
    if (!fig) return false; ir.given.push({ kind: 'length', seg: V[0] + V[1], value: parseNumber(m[1]) });
  });
  // «одна (из) сторона равна 5», «одна сторона на 4 больше другой», «… в 2 раза больше другой»
  each(new RegExp('одн[аой]+\\s+(?:из\\s+)?(?:его\\s+|ее\\s+|её\\s+)?(?<![а-я])сторон[а-я]*(?:\\s+[а-я]+){0,3}' + EQ + NUM + UNIT), m => {
    if (!fig) return false; ir.given.push({ kind: 'length', seg: V[0] + V[1], value: parseNumber(m[1]) }); fig.namedSide = V[0] + V[1];
  });
  each(new RegExp('одн[аой]+\\s+(?:из\\s+)?(?:его\\s+|ее\\s+|её\\s+)?(?<![а-я])сторон[а-я]*(?:\\s+[а-я]+)?\\s+на\\s+' + NUM + UNIT + '\\s+(больше|меньше|длиннее|короче)\\s+друг[а-я]*'), m => {
    if (!fig || V.length !== 4) return false;
    const big = V[0] + V[3], small = V[0] + V[1]; const v = parseNumber(m[1]);
    ir.given.push({ kind: 'diff', a: big, b: small, value: v });
    fig.longSide = big; fig.shortSide = small;
  });
  each(new RegExp('одн[аой]+\\s+(?:из\\s+)?(?:его\\s+|ее\\s+|её\\s+)?(?<![а-я])сторон[а-я]*(?:\\s+[а-я]+)?\\s+в\\s+' + NUM + '\\s+раза?\\s+(больше|меньше|длиннее|короче)\\s+друг[а-я]*'), m => {
    if (!fig || V.length !== 4) return false;
    const big = V[0] + V[3], small = V[0] + V[1];
    ir.given.push({ kind: 'mult', a: big, b: small, k: parseNumber(m[1]) });
    fig.longSide = big; fig.shortSide = small;
  });
  // «высота (трапеции) равна 5» без обозначения
  each(new RegExp('(?<![а-я])высот[а-я]*(?:\\s+[а-я]+)?(?:\\s+(?:трапеции|параллелограмма|ромба|треугольника))?' + EQ + NUM + UNIT), m => {
    if (!fig) return false;
    const c = defaultAltitude(ir, V);
    ir.given.push({ kind: 'length', seg: c.vertex + c.point, value: parseNumber(m[1]) });
  });
  // «средняя линия трапеции равна 9»
  each(new RegExp('средн[а-я]*\\s+лини[а-я]*(?:\\s+трапеции)?' + EQ + NUM + UNIT), m => {
    if (!fig || fig.type !== 'trapezoid') return false;
    ir.given.push({ kind: 'midline', value: parseNumber(m[1]) });
  });
  // «внешний угол при вершине C равен 110°»
  each(new RegExp('внешн[а-я]*\\s+угол\\s+(?:при\\s+вершине\\s+)?([A-Z])(?:\\s+[а-я]+){0,2}(?:\\s+[A-Z]{3})?' + EQ + NUM + DEG), m => {
    if (!fig) return false; ir.given.push({ kind: 'angle', angle: m[1], value: 180 - parseNumber(m[2]), why: 'смежный с внешним углом ' + m[2] + '°' });
  });
  // «угол B тупой / острый»
  each(/угол\s+([A-Z])\s+(тупой|острый)/, m => { if (!fig) return false; ir.given.push({ kind: m[2] === 'тупой' ? 'obtuse' : 'acute', angle: m[1] }); });
  // «сумма двух углов параллелограмма равна 100°»
  each(new RegExp('сумм[а-я]*\\s+двух\\s+(?:противолежащих\\s+)?углов(?:\\s+[а-я]+)?' + EQ + NUM + DEG), m => {
    if (!fig || V.length !== 4) return false; const v = parseNumber(m[1]);
    if (v >= 180) return false; ir.given.push({ kind: 'angle', angle: V[0], value: v / 2 });
  });
  // «стороны (треугольника) относятся как 3 : 4 : 5»
  each(new RegExp('(?<![а-я])сторон[а-я]*(?:\\s+[а-я]+){0,2}\\s+относятся\\s+как\\s+' + NUM + '\\s*:\\s*' + NUM + '(?:\\s*:\\s*' + NUM + ')?'), m => {
    if (!fig) return false;
    if (m[3] && V.length === 3) {
      ir.given.push({ kind: 'ratio', segs: [V[0] + V[1], V[1] + V[2]], ratio: [parseNumber(m[1]), parseNumber(m[2])] });
      ir.given.push({ kind: 'ratio', segs: [V[1] + V[2], V[0] + V[2]], ratio: [parseNumber(m[2]), parseNumber(m[3])] });
    } else ir.given.push({ kind: 'ratio', segs: [V[0] + V[1], V[0] + V[V.length - 1]], ratio: [parseNumber(m[1]), parseNumber(m[2])] });
  });
  // «одна из диагоналей равна 12», «диагональ (прямоугольника|которого) равна 10», «диагонали равны 6 и 8»
  each(new RegExp('(?:одн[аой]+\\s+из\\s+диагонал[а-я]*|диагонал[ьи]\\s+(?:которого|которой|его|ее|квадрата|прямоугольника|ромба|параллелограмма)|диагонал[ьи](?=\\s+(?:равн|—|=)))' + EQS + NUM + UNIT), m => {
    if (!fig || V.length !== 4) return false; ir.given.push({ kind: 'length', seg: V[0] + V[2], value: parseNumber(m[1]) });
  });
  // «O — точка пересечения диагоналей», «средняя линия пересекает …» (не влияет на ответ)
  each(/([A-Z])\s*(?:—|-|является)\s*точк[а-я]*\s+пересечени[а-я]*\s+диагонал[а-я]*(?:\s+[A-Z]{2}\s+и\s+[A-Z]{2})?/, m => {
    if (V.length !== 4) return false; ir.constructions.push({ kind: 'intersection', lines: [V[0] + V[2], V[1] + V[3]], point: m[1] });
  });
  each(/средн[а-я]*\s+лини[а-я]*\s+пересека[а-я]*\s+(?:диагонал[а-я]*\s+)?[A-Z]{2}\s+в\s+точк[а-я]*\s+[A-Z]/, () => {});
  // «AB = CD = 5 см»
  each(new RegExp(SEG + '\\s*=\\s*' + SEG + '\\s*=\\s*' + NUM + UNIT), m => {
    ir.given.push({ kind: 'length', seg: m[1], value: parseNumber(m[3]) });
    ir.given.push({ kind: 'length', seg: m[2], value: parseNumber(m[3]) });
  });
  // отрезки: «AD = 12 см», «сторона AB равна 3», «отрезок BK равен 4 см»
  each(new RegExp('(?:(?:(?<![а-я])сторон[а-яА-Я]*|отрез[а-яА-Я]*|основани[а-яА-Я]*|диагонал[а-яА-Я]*|высот[а-яА-Я]*|медиан[а-яА-Я]*|биссектрис[а-яА-Я]*|катет[а-яА-Я]*|гипотенуз[а-яА-Я]*|хорд[а-яА-Я]*|длин[а-яА-Я]*)\\s+)?' + SEG + EQ + NUM + UNIT + '(?!\\s*[·*]?\\s*[A-Z])'), m => {
    ir.given.push({ kind: 'length', seg: m[1], value: parseNumber(m[2]) });
  });
  // «AB = CD» (как отдельное утверждение) — равенство отрезков
  each(new RegExp(SEG + '\\s*=\\s*' + SEG + '(?![A-Z0-9])'), m => { ir.given.push({ kind: 'mult', a: m[1], b: m[2], k: 1 }); });

  // ---------- окружности ----------
  // «окружность вписана в треугольник», «около треугольника описана окружность» — сами
  // по себе ничего не задают, важны искомые радиусы (ниже, в parseFindList).
  each(/(?:в\s+(?:сам\s+|этот\s+|него\s+)?(?:треугольник[а-я]*\s+)?(?:[A-Z]{3}\s+)?)?(?:вписан[а-я]*|описан[а-я]*)\s+(?:другая\s+|ещё\s+одна\s+|еще\s+одна\s+)?окружност[а-я]*(?:\s+с\s+центром\s+[A-Z])?|окружност[а-я]*(?:\s+с\s+центром\s+[A-Z])?\s+(?:вписан[а-я]*|описан[а-я]*)(?:\s+(?:в|около)\s+(?:треугольник[а-я]*\s*)?(?:[A-Z]{3})?)?|около\s+(?:прямоугольного\s+|этого\s+)?треугольник[а-я]*(?:\s+[A-Z]{3})?(?=.{0,40}описан)/, () => {});
  // Касательная и секущая из внешней точки: «из точки P, лежащей вне окружности радиуса 5,
  // проведены касательная PA и секущая PB, проходящая через центр… расстояние от P до центра 13»
  const tan = text.match(/касательн[а-я]*\s+([A-Z])([A-Z])/);
  const rad = text.match(new RegExp('окружност[а-я]*\\s+(?:с\\s+центром\\s+([A-Z])\\s+(?:и\\s+)?)?радиус[а-я]*\\s+(?:равн[а-я]*\\s+)?' + NUM));
  let dist = text.match(new RegExp('расстояние\\s+от\\s+(?:точки\\s+)?([A-Z])\\s+до\\s+центра(?:\\s+окружности)?(?:\\s+([A-Z]))?' + EQ + NUM));
  if (!dist) { const d2 = text.match(new RegExp('(?:из\\s+)?точк[а-я]*\\s+([A-Z])\\s*,?\\s+(?:удален|удалён|отстоящ|находящ)[а-я]*\\s+от\\s+центра(?:\\s+окружности)?(?:\\s+([A-Z]))?\\s+на\\s+(?:расстояние\\s+)?' + NUM)); if (d2) dist = [d2[0], d2[1], d2[2], d2[3]]; }
  if (!fig && tan && rad && dist) {
    const P = tan[1], A = tan[2];
    const used = new Set(text.match(/[A-Z]/g) || []);
    const O = rad[1] || dist[2] || ['O', 'Q', 'Z'].find(x => !used.has(x));
    ir.figure = { type: 'triangle', vertices: [O, A, P], rightAngle: A, right: true, rightWhy: 'радиус ' + O + A + ' перпендикулярен касательной ' + P + A };
    ir.circles = [{ center: O, through: A }];
    ir.given.push({ kind: 'length', seg: O + A, value: parseNumber(rad[2]) });
    ir.given.push({ kind: 'length', seg: O + P, value: parseNumber(dist[3]) });
    const sec = text.match(/секущ[а-я]*\s+([A-Z])([A-Z])/);
    const nearName = ['C', 'K', 'M', 'N', 'T'].find(x => !used.has(x) && x !== O);
    ir.constructions.push({ kind: 'pointOn', seg: O + P, point: nearName, radiusOf: O });
    ir.given.push({ kind: 'length', seg: O + nearName, value: parseNumber(rad[2]), why: 'радиус' });
    if (/внешн[а-я]*\s+част[а-я]*\s+секущ/.test(text)) ir.find.push({ kind: 'length', seg: nearName + P, label: 'внешняя часть секущей' });
    if (/касательн/.test(text) && /найд|вычисл|чему/.test(text)) ir.find.push({ kind: 'length', seg: P + A });
    mask = mask.replace(/[^\s]/g, ' ');   // условие целиком понято этим шаблоном
    void sec;
  }

  // ---------- что найти ----------
  const findRe = /(?:найд[а-яА-Я]*|найти|вычисл[а-яА-Я]*|определ[а-яА-Я]*|чему\s+(?:равен|равн[а-яА-Я]*)|докаж[а-яА-Я]*,?\s+что)[:\s]+([^.?!]*)/g;
  let fm;
  const findMask = text;   // искомое берём из полного текста: «найдите высоту CH» уже разобрано как построение
  while ((fm = findRe.exec(findMask))) {
    const body = fm[1].replace(/\s(?:со|с)\s+(?:сторон|катет|гипотенуз|основани|диагонал|периметр|радиус|высот)[а-я]*(?:\s+[\d.,√]+(?:\s*(?:см|мм|дм|м))?(?:\s*,?\s*(?:и\s+)?(?:(?:с\s+)?высот[а-я]*\s+)?[\d.,√]+(?:\s*(?:см|мм|дм|м))?)*)?/g, ' ').split(/,?\s+(?:если|при\s+условии|когда|зная|учитывая)\s+/)[0];
    let consumedAll = parseFindList(body, ir, V);
    if (consumedAll) eat(fm.index, fm[0].length);
  }
  // «EF — ?» / «EF = ?» / «EF - ?»
  each(new RegExp(SEG + '\\s*(?:=|—|-)\\s*\\?'), m => { ir.find.push({ kind: 'length', seg: m[1] }); });
  each(new RegExp('(?:∠)([A-Z]{1,3})\\s*(?:=|—|-)\\s*\\?'), m => { ir.find.push({ kind: 'angle', angle: m[1] }); });

  // ---------- проверка: всё ли понято ----------
  const leftover = mask.replace(/(?:найд|вычисл)[а-яА-Я]*/g, ' ');
  const unknown = [];
  const sentences = leftover.split(/[.;!?\n]+/);
  for (const s of sentences) {
    const hasNum = /\d/.test(s);
    const names = (s.match(/(?:^|[^A-Za-z])([A-Z]{1,4})(?=$|[^A-Za-z])/g) || []).map(x => x.replace(/[^A-Z]/g, ''));
    const strange = names.filter(n => !(fig && n === V.join('')));
    if (hasNum || strange.length) unknown.push(s.trim());
  }

  // ---------- доделки ----------
  resolveTargets(ir);
  for (const c of ir.constructions) if (c.point === undefined || c.point === null || c.point === '') c.point = freeName(ir, V, 'P');
  ir.given = dedupe(ir.given, g => JSON.stringify(g));
  ir.constructions = dedupe(ir.constructions, c => c.kind + ':' + (c.point || c.seg));
  ir.find = dedupe(ir.find, f => JSON.stringify(f));
  // угол 90° при вершине треугольника → прямоугольный
  if (fig && fig.type === 'triangle') {
    for (const g of ir.given) if (g.kind === 'angle' && g.value === 90 && g.angle.length === 1 && !fig.rightAngle) { fig.rightAngle = g.angle; fig.right = true; }
  }

  if (ir.figure && ir.figure.type === 'triangle' && ir.figure.isosceles && !ir.figure.base) ir.figure.base = ir.figure.vertices[0] + ir.figure.vertices[2];
  const ok = !!(ir.figure && ir.find.length);
  return { ir, ok, unknown: unknown.filter(Boolean), normalized: text };
}

function dedupe(list, key) {
  const seen = new Set(); const out = [];
  for (const x of list) { const k = key(x); if (!seen.has(k)) { seen.add(k); out.push(x); } }
  return out;
}

export function trapBases(fig) {
  const V = fig.vertices;
  if (fig.bases && fig.bases.length === 2) return fig.bases;
  return [V[0] + V[3], V[1] + V[2]];
}

// Свободное имя для безымянной точки.
export function freeName(ir, V, pref) {
  const used = new Set(V);
  for (const c of ir.constructions) { if (c.point) used.add(c.point); }
  for (const g of ir.given) { for (const k of ['seg', 'a', 'b']) if (g[k]) for (const ch of g[k]) used.add(ch); }
  const cand = [pref, 'K', 'L', 'M', 'N', 'P', 'Q', 'T', 'H', 'E', 'F', 'O', 'S', 'R', 'X', 'Y', 'Z'];
  for (const c of cand) if (!used.has(c)) return c;
  return 'P' + (used.size + 1);
}

// Высота «без обозначения»: из верхней вершины к основанию (создаётся, если её нет).
function defaultAltitude(ir, V) {
  const t = ir.figure.type;
  const base = t === 'trapezoid' ? trapBases(ir.figure)[0] : V.length === 4 ? V[0] + V[3] : V[0] + V[2];
  const vert = t === 'trapezoid' ? trapBases(ir.figure)[1][0] : V[1];
  let c = ir.constructions.find(x => x.kind === 'altitude' && x.vertex === vert);
  if (!c) { c = { kind: 'altitude', vertex: vert, target: base, point: freeName(ir, V, 'H') }; ir.constructions.push(c); }
  return c;
}

// Сторона по словам: «основанию», «гипотенузе», «стороне AC», «большей стороне».
function sideByWord(ir, V, w) {
  w = String(w || '');
  const m = w.match(/[A-Z]{2}/); if (m) return m[0];
  const f = ir.figure;
  if (/основани/.test(w)) return f.type === 'trapezoid' ? trapBases(f)[0] : (f.base || (V.length === 3 ? V[0] + V[2] : V[0] + V[3]));
  if (/гипотенуз/.test(w)) { const r = f.rightAngle || V[2]; f.rightAngle = r; f.right = true; return V.filter(x => x !== r).join(''); }
  const sides = V.map((v, i) => i === V.length - 1 ? V[0] + v : v + V[i + 1]);
  const lenOf = sg => { const g = ir.given.find(x => x.kind === 'length' && (x.seg === sg || x.seg === sg[1] + sg[0])); return g ? g.value : null; };
  if (/больш|меньш/.test(w)) {
    const known = sides.map(sg => [sg, lenOf(sg)]).filter(x => x[1] !== null);
    if (known.length) { known.sort((a, b) => a[1] - b[1]); return (/больш/.test(w) ? known[known.length - 1] : known[0])[0]; }
  }
  return V.length === 3 ? V[0] + V[2] : V[0] + V[3];
}
function altitudeTo(ir, V, target) { return lineTo(ir, V, target, 'altitude', 'H'); }
function lineTo(ir, V, target, kind, pref) {
  const opp = V.length === 3 ? V.find(x => !target.includes(x)) : (V.indexOf(target[0]) === 0 || V.indexOf(target[1]) === 0 ? V.find(x => !target.includes(x) && x !== V[V.length - 1]) || V[1] : V[0]);
  let c = ir.constructions.find(x => x.kind === kind && x.vertex === opp && (x.target === target || x.target === target[1] + target[0]));
  if (!c) { c = { kind, vertex: opp, target, point: freeName(ir, V, pref) }; ir.constructions.push(c); }
  return c;
}

// Разбор списка искомого: «отрезок EF», «угол B и периметр», «площадь треугольника ABE».
function parseFindList(body, ir, V) {
  let s = ' ' + body + ' ';
  let any = false;
  const push = f => { ir.find.push(f); any = true; };
  // относительные обороты («…, диагональ которого равна 6») — не искомое
  s = s.replace(/,?\s*[а-я]+\s+(?:которого|которой|которых|который)\s+[^,]*/g, ' ');
  // упоминания фигуры внутри искомого («угол C треугольника ABC») — не искомое
  s = s.replace(/(?:треугольник|параллелограмм|ромб|квадрат|прямоугольник|трапеци|четырехугольник)[а-я]*\s+([A-Z]{3,4})\b/g, (w, nm) => (nm === V.join('') && !/площад|периметр/.test(s) ? ' ' : w));
  // sin/cos/tg угла
  s = s.replace(/(sin|cos|tg|tan|ctg)\s*∠?\s*([A-Z]{1,3})\b/g, (w, f, a) => { push({ kind: 'trig', fn: f === 'tan' ? 'tg' : f, angle: a }); return ' '; });
  // средняя линия трапеции
  s = s.replace(/(?:длин[а-я]*\s+)?(?:ее\s+|её\s+|его\s+)?средн[а-я]*\s+лини[а-я]*(?:\s+трапеции)?/g, () => { push({ kind: 'midline' }); return ' '; });
  // «медиану/высоту/биссектрису, проведённую к стороне AC / к основанию / к гипотенузе / к большей стороне / к этой стороне»
  s = s.replace(/(медиан|высот|биссектрис)[а-я]*\s*,?\s+(?:проведенн|опущенн)[а-я]*\s+(?:к|на)\s+(основани[а-я]*|гипотенуз[а-я]*|(?<![а-я])сторон[а-я]*\s+[A-Z]{2}|больш[а-я]*\s+(?<![а-я])сторон[а-я]*|меньш[а-я]*\s+(?<![а-я])сторон[а-я]*|этой\s+(?<![а-я])сторон[а-я]*|ней)/g, (w, kind, side) => {
    const target = /этой|ней/.test(side) ? (ir.figure.namedSide || V[0] + V[1]) : sideByWord(ir, V, side);
    const c = kind === 'высот' ? altitudeTo(ir, V, target) : kind === 'медиан' ? lineTo(ir, V, target, 'median', 'M') : lineTo(ir, V, target, 'bisector', 'L');
    push({ kind: 'length', seg: c.vertex + c.point }); return ' ';
  });
  // «другую диагональ», «меньшую/большую диагональ», «диагональ» (уже выше), «сторону» (одну)
  s = s.replace(/(друг|меньш|больш)[а-я]*\s+диагонал[а-я]*/g, (w, k) => { push({ kind: 'length', seg: k === 'друг' ? V[1] + V[3] : V[0] + V[2], pick: k === 'меньш' ? 'minDiag' : k === 'больш' ? 'maxDiag' : undefined }); return ' '; });
  s = s.replace(/(?<!(?:больш|меньш)[а-я]*\s)(?:угол\s+(?:ромба|параллелограмма|трапеции))/g, () => { push({ kind: 'angle', angle: V[0], pick: 'acute' }); return ' '; });
  // «третий угол», «другой (острый) угол», «угол при вершине/основании», «боковую сторону», «другой катет», «большую/меньшую сторону»
  s = s.replace(/третий\s+угол/g, () => { const have = new Set(ir.given.filter(g => g.kind === 'angle').map(g => g.angle)); push({ kind: 'angle', angle: V.find(x => !have.has(x)) || V[2] }); return ' '; });
  s = s.replace(/друг[а-я]*\s+(?:острый\s+)?угол/g, () => { const have = new Set(ir.given.filter(g => g.kind === 'angle').map(g => g.angle)); const r = ir.figure.rightAngle; push({ kind: 'angle', angle: V.find(x => !have.has(x) && x !== r) || V[1] }); return ' '; });
  s = s.replace(/угол\s+при\s+вершине(?:\s+[а-я]+){0,2}/g, () => { const b = ir.figure.base || (V[0] + V[2]); push({ kind: 'angle', angle: V.find(x => !b.includes(x)) }); return ' '; });
  s = s.replace(/угол\s+при\s+основании(?:\s+[а-я]+){0,2}/g, () => { const b = ir.figure.base || (V[0] + V[2]); push({ kind: 'angle', angle: b[0] }); return ' '; });
  s = s.replace(/боков[а-я]*\s+(?<![а-я])сторон[а-я]*(?:\s+[а-я]+){0,1}/g, () => {
    if (ir.figure.type === 'trapezoid') { const bs = trapBases(ir.figure); push({ kind: 'length', seg: bs[0][0] + bs[1][0] }); }
    else { const b = ir.figure.base || (V[0] + V[2]); const ap = V.find(x => !b.includes(x)); push({ kind: 'length', seg: b[0] + ap }); }
    return ' ';
  });
  s = s.replace(/друг[а-я]*\s+катет[а-я]*/g, () => { const r = ir.figure.rightAngle || V[2]; const o = V.filter(x => x !== r); push({ kind: 'length', seg: o[1] + r }); return ' '; });
  s = s.replace(/(больш|меньш)[а-я]*\s+(?<![а-я])сторон[а-я]*(?:\s+[а-я]+){0,1}/g, (w, k) => {
    const f = ir.figure; const big = f.longSide || V[0] + V[V.length === 4 ? 3 : 2], small = f.shortSide || V[0] + V[1];
    push({ kind: 'length', seg: k === 'больш' ? big : small, pick: k === 'больш' ? 'max' : 'min' }); return ' ';
  });
  s = s.replace(/(?:все\s+)?угл[а-яА-Я]*\s+(?:параллелограмма|ромба|трапеции|треугольника|четырехугольника|прямоугольника)(?:\s+[A-Z]{3,4})?/g, () => { V.forEach(v => push({ kind: 'angle', angle: v })); return ' '; });
  s = s.replace(/(?:больш[а-яА-Я]*|меньш[а-яА-Я]*)\s+угол[а-яА-Я]*(?:\s+[а-я]+)?/g, w => { push({ kind: 'angle', angle: V[/больш/.test(w) ? 1 : 0] || 'A', extreme: /больш/.test(w) ? 'max' : 'min' }); return ' '; });
  s = s.replace(/сторону\s+(?:параллелограмма|прямоугольника|ромба|квадрата|треугольника)(?:\s+[A-Z]{3,4})?/g, () => { push({ kind: 'length', seg: V[0] + V[1] }); return ' '; });
  s = s.replace(/(?<![а-я])(?:все\s+)?(?<![а-я])сторон[а-яА-Я]*\s+(?:параллелограмма|прямоугольника|треугольника|ромба|трапеции|четырехугольника)(?:\s+[A-Z]{3,4})?/g, () => {
    for (let i = 0; i < V.length; i++) push({ kind: 'length', seg: i === V.length - 1 ? V[0] + V[i] : V[i] + V[i + 1] });
    return ' ';
  });
  s = s.replace(/(?:его|ее|их)?\s*периметр[а-яА-Я]*(?:\s+(?:[а-я]+\s+)?([A-Z]{3,4}))?/g, (w, of) => { push({ kind: 'perimeter', of: of || null }); return ' '; });
  s = s.replace(/(?:его|ее|их)?\s*площад[а-яА-Я]*(?:\s+(?:[а-я]+\s+)?([A-Z]{3,4}))?/g, (w, of) => { push({ kind: 'area', of: of || null }); return ' '; });
  s = s.replace(/(?:∠|угол\s+|угла\s+|величину\s+угла\s+|градусную\s+меру\s+угла\s+)([A-Z]{1,3})\b/g, (w, a) => { push({ kind: 'angle', angle: a }); return ' '; });
  s = s.replace(/(?<![A-Z])(?:(?:длин[а-яА-Я]*\s+)?(?:отрез[а-яА-Я]*|(?<![а-я])сторон[а-яА-Я]*|основани[а-яА-Я]*|диагонал[а-яА-Я]*|высот[а-яА-Я]*|медиан[а-яА-Я]*|биссектрис[а-яА-Я]*|катет[а-яА-Я]*|гипотенуз[а-яА-Я]*)\s+)?([A-Z][0-9]?[A-Z][0-9]?)\b/g, (w, seg) => { push({ kind: 'length', seg }); return ' '; });
  // Окружности треугольника
  s = s.replace(/расстояни[а-я]*\s+между\s+(?:их\s+)?центрами(?:\s+(?:этих\s+)?(?:двух\s+)?(?:вписанной\s+и\s+описанной\s+)?окружностей)?/g, () => { push({ kind: 'centersDist' }); return ' '; });
  s = s.replace(/радиус[а-я]*\s+окружност[а-я]*,?\s+(вписанн|описанн)[а-я]*(?:\s+(?:в|около)\s+(?:[а-я]+\s+){0,2}треугольник[а-я]*(?:\s+[A-Z]{3})?)?/g, (w, k) => { push({ kind: k === 'вписанн' ? 'inradius' : 'circumradius' }); return ' '; });
  s = s.replace(/радиус[а-я]*\s+вписанн[а-я]*\s+(?:в\s+(?:него|треугольник[а-я]*)\s+)?окружност[а-я]*/g, () => { push({ kind: 'inradius' }); return ' '; });
  s = s.replace(/радиус[а-я]*\s+описанн[а-я]*\s+(?:около\s+(?:него|треугольник[а-я]*)\s+)?окружност[а-я]*/g, () => { push({ kind: 'circumradius' }); return ' '; });
  // Без обозначений: «высоту трапеции», «её диагональ», «гипотенузу»
  s = s.replace(/высот[а-яА-Я]*(?:\s+(?:трапеции|параллелограмма|ромба|треугольника))?/g, () => {
    if (V.length < 3) return ' ';
    const c = defaultAltitude(ir, V);
    push({ kind: 'length', seg: c.vertex + c.point });
    return ' ';
  });
  s = s.replace(/(?:длин[а-яА-Я]*\s+)?(?:ее\s+|его\s+)?диагонал[а-яА-Я]*/g, () => { if (V.length === 4) push({ kind: 'length', seg: V[0] + V[2] }); return ' '; });
  s = s.replace(/гипотенуз[а-яА-Я]*/g, () => { if (V.length === 3) { const r = ir.figure.rightAngle || V[2]; push({ kind: 'length', seg: V.filter(x => x !== r).join('') }); } return ' '; });
  // Слова без обозначений: «высоту», «гипотенузу», «диагональ» — оставим ИИ.
  s = s.replace(/(?<![а-я])(?:его\s+|ее\s+|её\s+)?(?:сторону|катет)(?![а-я])/g, (w) => {
    if (/катет/.test(w) && V.length === 3) { const r = ir.figure.rightAngle || V[2]; const o = V.filter(x => x !== r); push({ kind: 'length', seg: o[1] + r }); }
    else push({ kind: 'length', seg: V[0] + V[1] });
    return ' ';
  });
  return any && !/[A-Z0-9]/.test(s.replace(/\s+/g, ''));
}

// Куда падает биссектриса / медиана / высота, если сторона не названа.
function resolveTargets(ir) {
  const fig = ir.figure;
  if (!fig) return;
  const V = fig.vertices;
  for (const c of ir.constructions) {
    if (!['bisector', 'median', 'altitude'].includes(c.kind) || c.target) continue;
    const p = c.point;
    // 1) сторона, на которой по условию лежит точка (упомянуты отрезки вида BK, KC)
    const segsWithP = [];
    for (const g of ir.given) for (const k of ['seg', 'a', 'b']) if (g[k] && g[k].includes(p)) segsWithP.push(g[k].replace(p, ''));
    for (const f of ir.find) if (f.seg && f.seg.includes(p)) segsWithP.push(f.seg.replace(p, ''));
    const ends = uniq(segsWithP.filter(x => V.includes(x) && x !== c.vertex));
    if (ends.length >= 2) { c.target = ends[0] + ends[1]; continue; }
    const notAdj = [];
    for (let i = 0; i < V.length; i++) {
      const a = V[i], b = V[(i + 1) % V.length];
      if (a !== c.vertex && b !== c.vertex) notAdj.push(a + b);
    }
    if (ends.length === 1) { const t = notAdj.find(s => s.includes(ends[0])); if (t) { c.target = t; continue; } }
    // 2) треугольник — противоположная сторона; четырёхугольник — сторона, лежащая
    //    напротив стороны, по которой идёт вершина (для ABCD из B и C — AD, из A и D — BC)
    if (V.length === 3) c.target = notAdj[0];
    else {
      const i = V.indexOf(c.vertex);
      c.target = (i === 1 || i === 2) ? V[0] + V[3] : V[1] + V[2];
      if (fig.type === 'trapezoid') {
        const bs = trapBases(fig);
        c.target = bs.find(b => !b.includes(c.vertex)) || c.target;
      }
    }
  }
}
