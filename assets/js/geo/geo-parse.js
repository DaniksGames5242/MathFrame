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

// Кириллические буквы, похожие на латинские: ученики часто набирают «АВС» русскими.
const CYR2LAT = { 'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X', 'У': 'Y' };

const NUM = '(\\d+(?:[.,]\\d+)?\\s*√\\s*\\d+(?:[.,]\\d+)?|√\\s*\\d+(?:[.,]\\d+)?|\\d+(?:[.,]\\d+)?(?:\\s*\\/\\s*\\d+)?)';
const UNIT = '(?:\\s*(см|мм|дм|км|м)(?![а-яА-Я])\\.?)?';
const DEG = '\\s*(?:°|º|градус[а-яА-Я]*|грд\\.?)?';
const EQ = '\\s*(?:=|равен|равн[а-яА-Я]*|составляет|—)\\s*';
const SEG = '([A-Z][0-9]?[A-Z][0-9]?)';

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
  let t = String(src || '').replace(/\r/g, '').replace(/ё/g, 'е').replace(/Ё/g, 'Е');
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
  each(/биссектрис[а-яА-Я]*\s+угл[а-яА-Я]*\s+([A-Z])(?:\s*,\s*([A-Z]))?(?:\s+и\s+([A-Z]))?(?:\s+[а-яА-Я]+)*?\s+(?:пересека[а-яА-Я]*|дел[а-яА-Я]*|отсека[а-яА-Я]*|встреча[а-яА-Я]*|падают\s+на|проходят\s+через)?\s*(?:сторон[а-яА-Я]*|основани[а-яА-Я]*|отрез[а-яА-Я]*|прям[а-яА-Я]*|продолжени[а-яА-Я]*\s+сторон[а-яА-Я]*)\s+([A-Z]{2})\s+в\s+точк[а-яА-Я]*\s+([A-Z])(?:\s*(?:,|и)\s*([A-Z]))?(?:\s*(?:,|и)\s*([A-Z]))?(?:\s*,?\s*соответственно)?/, m => {
    const verts = [m[1], m[2], m[3]].filter(Boolean);
    const pts = [m[5], m[6], m[7]].filter(Boolean);
    if (pts.length !== verts.length) return false;
    verts.forEach((v, i) => addCons({ kind: 'bisector', vertex: v, target: m[4], point: pts[i] }));
  });
  // «Биссектриса угла A пересекает сторону BC в точке K» / «…угла BAD…»
  each(/биссектрис[а-яА-Я]*\s+(?:угл[а-яА-Я]*\s+)?(?:∠)?([A-Z]{1,3})(?:\s+[а-яА-Я]+)*?\s+(?:пересека[а-яА-Я]*|дел[а-яА-Я]*|отсека[а-яА-Я]*)\s+(?:сторон[а-яА-Я]*|основани[а-яА-Я]*|отрез[а-яА-Я]*|прям[а-яА-Я]*)?\s*([A-Z]{2})\s+в\s+точк[а-яА-Я]*\s+([A-Z])/, m => {
    const a = m[1];
    addCons({ kind: 'bisector', vertex: a.length === 3 ? a[1] : a[0], angle: a.length === 3 ? a : undefined, target: m[2], point: m[3] });
  });
  // «Биссектриса угла A делит сторону BC на отрезки BK = 4 и KC = 3» / «…на отрезки 4 и 3, считая от вершины B»
  const RE_DIVIDES = new RegExp(/биссектрис[а-яА-Я]*\s+(?:угл[а-яА-Я]*\s+)?([A-Z])\s+(?:[а-яА-Я]+\s+)*?дел[а-яА-Я]*\s+сторон[а-яА-Я]*\s+([A-Z]{2})\s+на\s+отрезки\s+(?:([A-Z]{2})\s*=\s*)?NUM(?:\s*(?:см|мм|дм|м))?\s+и\s+(?:([A-Z]{2})\s*=\s*)?NUM(?:\s*(?:см|мм|дм|м))?(?:\s*,?\s*считая\s+от\s+(?:вершины|точки)\s+([A-Z]))?/.source.replace(/NUM/g, NUM));
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
    each(new RegExp('(?:проведен[а-яА-Я]*\\s+)?' + kindRe + '\\s+' + SEG + '(?:\\s+(?:к|на)\\s+(?:сторон[а-яА-Я]*|основани[а-яА-Я]*|прям[а-яА-Я]*|гипотенуз[а-яА-Я]*)?\\s*([A-Z]{2}))?'), m => {
      const s = m[1]; const t = m[2];
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
  each(/из\s+вершины\s+([A-Z])\s+(?:проведен[а-яА-Я]*|опущен[а-яА-Я]*)\s+(высот[а-яА-Я]*|биссектрис[а-яА-Я]*|медиан[а-яА-Я]*|перпендикуляр[а-яА-Я]*)\s+([A-Z]{2})?\s*(?:к|на)\s+(?:сторон[а-яА-Я]*|основани[а-яА-Я]*|прям[а-яА-Я]*)?\s*([A-Z]{2})/, m => {
    const kind = /высот|перпенд/.test(m[2]) ? 'altitude' : /биссектр/.test(m[2]) ? 'bisector' : 'median';
    const pt = m[3] ? m[3].replace(m[1], '') : freeName(ir, V, kind === 'altitude' ? 'H' : kind === 'median' ? 'M' : 'L');
    addCons({ kind, vertex: m[1], target: m[4], point: pt });
  });
  // «перпендикуляр BH к стороне AD»
  each(/перпендикуляр[а-яА-Я]*\s+([A-Z]{2})\s+(?:к|на)\s+(?:сторон[а-яА-Я]*|основани[а-яА-Я]*|прям[а-яА-Я]*)?\s*([A-Z]{2})/, m => {
    const s = m[1]; const vert = isVertex(s[0]) ? s[0] : s[1];
    addCons({ kind: 'altitude', vertex: vert, target: m[2], point: s.replace(vert, '') });
  });
  // середины
  each(/точк[а-яА-Я]*\s+([A-Z])\s+и\s+([A-Z])\s*(?:—|-|являются)\s*середин[а-яА-Я]*\s+(?:сторон\s+|отрезков\s+)?([A-Z]{2})\s+и\s+([A-Z]{2})(?:\s+соответственно)?/, m => {
    addCons({ kind: 'midpoint', seg: m[3], point: m[1] });
    addCons({ kind: 'midpoint', seg: m[4], point: m[2] });
  });
  each(/(?:точк[а-яА-Я]*\s+)?([A-Z])\s*(?:—|-|является)\s*середин[а-яА-Я]*\s+(?:сторон[а-яА-Я]*\s+|отрезк[а-яА-Я]*\s+|основани[а-яА-Я]*\s+|гипотенуз[а-яА-Я]*\s+|диагонал[а-яА-Я]*\s+)?([A-Z]{2})/, m => { addCons({ kind: 'midpoint', seg: m[2], point: m[1] }); });
  each(/середин[а-яА-Я]*\s+(?:сторон[а-яА-Я]*\s+|отрезк[а-яА-Я]*\s+)?([A-Z]{2})\s*(?:—|-)?\s*точк[а-яА-Я]*\s+([A-Z])/, m => { addCons({ kind: 'midpoint', seg: m[1], point: m[2] }); });
  // диагонали
  each(/диагонал[а-яА-Я]*\s+([A-Z]{2})\s+и\s+([A-Z]{2})(?:\s+[а-яА-Я]+)*?\s+пересека[а-яА-Я]*\s+в\s+точк[а-яА-Я]*\s+([A-Z])/, m => { addCons({ kind: 'intersection', lines: [m[1], m[2]], point: m[3] }); });
  each(/диагонал[а-яА-Я]*(?:\s+[а-яА-Я]+)*?\s+пересека[а-яА-Я]*\s+в\s+точк[а-яА-Я]*\s+([A-Z])/, m => {
    if (V.length !== 4) return false;
    addCons({ kind: 'intersection', lines: [V[0] + V[2], V[1] + V[3]], point: m[1] });
  });
  // «отрезки AM и BK пересекаются в точке O»
  each(/(?:отрезк[а-яА-Я]*|прям[а-яА-Я]*)\s+([A-Z]{2})\s+и\s+([A-Z]{2})\s+пересека[а-яА-Я]*\s+в\s+точк[а-яА-Я]*\s+([A-Z])/, m => { addCons({ kind: 'intersection', lines: [m[1], m[2]], point: m[3] }); });
  // «биссектрисы углов A и B пересекаются в точке O»
  each(/биссектрис[а-яА-Я]*\s+угл[а-яА-Я]*\s+([A-Z])\s+и\s+([A-Z])\s+пересека[а-яА-Я]*\s+в\s+точк[а-яА-Я]*\s+([A-Z])(?:\s*,?\s*(?:лежащей|принадлежащей)\s+(?:сторон[а-яА-Я]*|основани[а-яА-Я]*)\s+([A-Z]{2}))?/, m => {
    addCons({ kind: 'bisectorMeet', vertices: [m[1], m[2]], point: m[3] });
    if (m[4]) ir.given.push({ kind: 'onLine', point: m[3], seg: m[4] });
  });
  // точка на стороне
  each(/(?:на\s+сторон[а-яА-Я]*|на\s+основани[а-яА-Я]*|на\s+отрезк[а-яА-Я]*|на\s+диагонал[а-яА-Я]*)\s+([A-Z]{2})\s+(?:[а-яА-Я]+\s+)?(?:взят[а-яА-Я]*|отмечен[а-яА-Я]*|выбран[а-яА-Я]*|лежит|дана)?\s*точк[а-яА-Я]*\s+([A-Z])/, m => { addCons({ kind: 'pointOn', seg: m[1], point: m[2] }); });
  each(/точк[а-яА-Я]*\s+([A-Z])\s+(?:лежит|взята|отмечена|выбрана|расположена)\s+на\s+(?:сторон[а-яА-Я]*|основани[а-яА-Я]*|отрезк[а-яА-Я]*|диагонал[а-яА-Я]*)\s+([A-Z]{2})/, m => { addCons({ kind: 'pointOn', seg: m[2], point: m[1] }); });
  // проведён отрезок / диагональ
  each(/(?:проведен[а-яА-Я]*|провели|соединили|построен[а-яА-Я]*)\s+(?:диагонал[а-яА-Я]*|отрез[а-яА-Я]*|средн[а-яА-Я]*\s+лини[а-яА-Я]*)\s+([A-Z]{2})(?:\s+и\s+([A-Z]{2}))?/, m => { addCons({ kind: 'segment', seg: m[1] }); if (m[2]) addCons({ kind: 'segment', seg: m[2] }); });

  // ---------- данные ----------
  // «AB : BC = 2 : 3», «AB и BC относятся как 2 : 3»
  each(new RegExp(SEG + '\\s*:\\s*' + SEG + '\\s*=\\s*' + NUM + '\\s*:\\s*' + NUM), m => { ir.given.push({ kind: 'ratio', segs: [m[1], m[2]], ratio: [parseNumber(m[3]), parseNumber(m[4])] }); });
  each(new RegExp('(?:сторон[а-яА-Я]*\\s+)?' + SEG + '\\s+и\\s+' + SEG + '\\s+относятся\\s+как\\s+' + NUM + '\\s*:\\s*' + NUM), m => { ir.given.push({ kind: 'ratio', segs: [m[1], m[2]], ratio: [parseNumber(m[3]), parseNumber(m[4])] }); });
  // «BC = 2AB», «BC = 2·AB»
  each(new RegExp(SEG + '\\s*=\\s*' + NUM + '\\s*[·*⋅]?\\s*' + SEG + '(?![A-Z])'), m => { ir.given.push({ kind: 'mult', a: m[1], b: m[3], k: parseNumber(m[2]) }); });
  // «AB в 2 раза больше (меньше) BC»
  each(new RegExp(SEG + '\\s+в\\s+' + NUM + '\\s+раза?\\s+(больше|меньше|длиннее|короче)\\s+(?:сторон[а-яА-Я]*\\s+|отрезк[а-яА-Я]*\\s+)?' + SEG), m => {
    const k = parseNumber(m[2]); const bigger = /больше|длиннее/.test(m[3]);
    ir.given.push({ kind: 'mult', a: m[1], b: m[4], k: bigger ? k : 1 / k });
  });
  // «AB на 3 см больше (меньше) BC»
  each(new RegExp(SEG + '\\s+на\\s+' + NUM + UNIT + '\\s+(больше|меньше|длиннее|короче)\\s+(?:сторон[а-яА-Я]*\\s+|отрезк[а-яА-Я]*\\s+)?' + SEG), m => {
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
  each(new RegExp('угол\\s+между\\s+(?:ними|этими\\s+сторонами|сторонами|сторонами\\s+[A-Z]{2}\\s+и\\s+[A-Z]{2})' + EQ + NUM + DEG), m => {
    if (!fig) return false;
    ir.given.push({ kind: 'angle', angle: V[0], value: parseNumber(m[1]) });
  });
  // «один из углов параллелограмма равен 60°» / «острый угол ... равен»
  each(new RegExp('(?:один\\s+из\\s+углов|острый\\s+угол|тупой\\s+угол|угол\\s+при\\s+основании)(?:\\s+[а-я]+)?' + EQ + NUM + DEG), m => {
    if (!fig) return false;
    const v = parseNumber(m[1]);
    const obtuse = /тупой/.test(m[0]);
    let vert = V[0];
    if (fig.type === 'trapezoid' || (fig.type === 'triangle' && /основани/.test(m[0]))) vert = V[0];
    if ((obtuse && v < 90) || (!obtuse && v > 90 && fig.type !== 'triangle')) vert = V[1];
    ir.given.push({ kind: 'angle', angle: vert, value: v });
  });
  // периметр/площадь
  each(new RegExp('периметр[а-яА-Я]*(?:\\s+(?:[а-я]+\\s+)?([A-Z]{3,4}))?' + EQ + NUM + UNIT), m => { ir.given.push({ kind: 'perimeter', of: m[1] || null, value: parseNumber(m[2]) }); });
  each(new RegExp('площад[а-яА-Я]*(?:\\s+(?:[а-я]+\\s+)?([A-Z]{3,4}))?' + EQ + NUM + '(?:\\s*(?:кв\\.?\\s*)?(?:см|мм|дм|м)(?:²|2|\\^2)?\\.?)?'), m => { ir.given.push({ kind: 'area', of: m[1] || null, value: parseNumber(m[2]) }); });
  // «стороны параллелограмма равны 5 и 7», «основания трапеции равны 4 и 10», «катеты равны 3 и 4»
  each(new RegExp('(сторон[а-яА-Я]*|основани[а-яА-Я]*|катет[а-яА-Я]*|диагонал[а-яА-Я]*|боков[а-яА-Я]*\\s+сторон[а-яА-Я]*)(?:\\s+[а-я]+)?\\s+(?:равен|равн[а-яА-Я]*)\\s+' + NUM + UNIT + '\\s+и\\s+' + NUM + UNIT), m => {
    if (!fig) return false;
    const a = parseNumber(m[2]), b = parseNumber(m[4]);
    const w = m[1];
    let segs = null;
    if (/основани/.test(w) && fig.type === 'trapezoid') { const bs = trapBases(fig); segs = [bs[1], bs[0]]; if (a > b) segs = [bs[0], bs[1]]; }
    else if (/катет/.test(w) && fig.type === 'triangle') { const r = fig.rightAngle || V[2]; const others = V.filter(x => x !== r); segs = [others[0] + r, others[1] + r]; fig.rightAngle = r; fig.right = true; }
    else if (/диагонал/.test(w) && V.length === 4) segs = [V[0] + V[2], V[1] + V[3]];
    else if (/сторон/.test(w) && V.length === 4) segs = [V[0] + V[1], V[0] + V[3]];
    if (!segs) return false;
    ir.given.push({ kind: 'length', seg: segs[0], value: a });
    ir.given.push({ kind: 'length', seg: segs[1], value: b });
  });
  // «треугольник со сторонами 3, 4 и 5», «стороны треугольника равны 5, 6 и 7»
  each(new RegExp('(?:со\\s+сторонами|сторон[а-я]*\\s+(?:[а-я]+\\s+)?(?:равны|—))\\s+' + NUM + UNIT + '\\s*,\\s*' + NUM + UNIT + '\\s*,?\\s+и\\s+' + NUM + UNIT), m => {
    if (!fig || fig.type !== 'triangle') return false;
    ir.given.push({ kind: 'length', seg: V[0] + V[1], value: parseNumber(m[1]) });
    ir.given.push({ kind: 'length', seg: V[1] + V[2], value: parseNumber(m[3]) });
    ir.given.push({ kind: 'length', seg: V[0] + V[2], value: parseNumber(m[5]) });
  });
  // «параллелограмм со сторонами 4 и 6 (и углом 30°)»
  each(new RegExp('со\\s+сторонами\\s+' + NUM + UNIT + '\\s+и\\s+' + NUM + UNIT + '(?:\\s*(?:,|и)\\s*(?:углом|острым\\s+углом)(?:\\s+между\\s+ними)?\\s+' + NUM + DEG + ')?'), m => {
    if (!fig || V.length !== 4) return false;
    ir.given.push({ kind: 'length', seg: V[0] + V[1], value: parseNumber(m[1]) });
    ir.given.push({ kind: 'length', seg: V[0] + V[3], value: parseNumber(m[3]) });
    if (m[5]) ir.given.push({ kind: 'angle', angle: V[0], value: parseNumber(m[5]) });
  });
  // «… делит сторону AD на отрезки AH = 6 и HD = 4» — сами отрезки разберёт шаблон длин ниже
  each(/(?:дел[а-я]*|разбивает)\s+(?:сторон[а-я]*|основани[а-я]*|гипотенуз[а-я]*|отрезок)\s+[A-Z]{2}\s+на\s+отрезки(?=\s+[A-Z]{2}\s*=)/, () => {});
  // «сторона ромба равна 5», «сторона квадрата 4 см», «гипотенуза равна 10»
  each(new RegExp('(сторон[а-яА-Я]*|гипотенуз[а-яА-Я]*|боков[а-яА-Я]*\\s+сторон[а-яА-Я]*|основани[а-яА-Я]*|радиус[а-яА-Я]*)(?:\\s+[а-я]+)?' + EQ + NUM + UNIT), m => {
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
  // «AB = CD = 5 см»
  each(new RegExp(SEG + '\\s*=\\s*' + SEG + '\\s*=\\s*' + NUM + UNIT), m => {
    ir.given.push({ kind: 'length', seg: m[1], value: parseNumber(m[3]) });
    ir.given.push({ kind: 'length', seg: m[2], value: parseNumber(m[3]) });
  });
  // отрезки: «AD = 12 см», «сторона AB равна 3», «отрезок BK равен 4 см»
  each(new RegExp('(?:(?:сторон[а-яА-Я]*|отрез[а-яА-Я]*|основани[а-яА-Я]*|диагонал[а-яА-Я]*|высот[а-яА-Я]*|медиан[а-яА-Я]*|биссектрис[а-яА-Я]*|катет[а-яА-Я]*|гипотенуз[а-яА-Я]*|хорд[а-яА-Я]*|длин[а-яА-Я]*)\\s+)?' + SEG + EQ + NUM + UNIT + '(?!\\s*[·*]?\\s*[A-Z])'), m => {
    ir.given.push({ kind: 'length', seg: m[1], value: parseNumber(m[2]) });
  });
  // «AB = CD» (как отдельное утверждение) — равенство отрезков
  each(new RegExp(SEG + '\\s*=\\s*' + SEG + '(?![A-Z0-9])'), m => { ir.given.push({ kind: 'mult', a: m[1], b: m[2], k: 1 }); });

  // ---------- что найти ----------
  const findRe = /(?:найд[а-яА-Я]*|вычисл[а-яА-Я]*|определ[а-яА-Я]*|чему\s+(?:равен|равн[а-яА-Я]*)|докаж[а-яА-Я]*,?\s+что)[:\s]+([^.?!]*)/g;
  let fm;
  const findMask = text;   // искомое берём из полного текста: «найдите высоту CH» уже разобрано как построение
  while ((fm = findRe.exec(findMask))) {
    const body = fm[1];
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

  const ok = !!(fig && ir.find.length);
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

// Разбор списка искомого: «отрезок EF», «угол B и периметр», «площадь треугольника ABE».
function parseFindList(body, ir, V) {
  let s = ' ' + body + ' ';
  let any = false;
  const push = f => { ir.find.push(f); any = true; };
  s = s.replace(/(?:все\s+)?угл[а-яА-Я]*\s+(?:параллелограмма|ромба|трапеции|треугольника|четырехугольника|прямоугольника)(?:\s+[A-Z]{3,4})?/g, () => { V.forEach(v => push({ kind: 'angle', angle: v })); return ' '; });
  s = s.replace(/(?:больш[а-яА-Я]*|меньш[а-яА-Я]*)\s+угол[а-яА-Я]*(?:\s+[а-я]+)?/g, w => { push({ kind: 'angle', angle: V[/больш/.test(w) ? 1 : 0] || 'A', extreme: /больш/.test(w) ? 'max' : 'min' }); return ' '; });
  s = s.replace(/сторону\s+(?:параллелограмма|прямоугольника|ромба|квадрата|треугольника)(?:\s+[A-Z]{3,4})?/g, () => { push({ kind: 'length', seg: V[0] + V[1] }); return ' '; });
  s = s.replace(/(?:все\s+)?сторон[а-яА-Я]*\s+(?:параллелограмма|прямоугольника|треугольника|ромба|трапеции|четырехугольника)(?:\s+[A-Z]{3,4})?/g, () => {
    for (let i = 0; i < V.length; i++) push({ kind: 'length', seg: i === V.length - 1 ? V[0] + V[i] : V[i] + V[i + 1] });
    return ' ';
  });
  s = s.replace(/(?:его|ее|их)?\s*периметр[а-яА-Я]*(?:\s+(?:[а-я]+\s+)?([A-Z]{3,4}))?/g, (w, of) => { push({ kind: 'perimeter', of: of || null }); return ' '; });
  s = s.replace(/(?:его|ее|их)?\s*площад[а-яА-Я]*(?:\s+(?:[а-я]+\s+)?([A-Z]{3,4}))?/g, (w, of) => { push({ kind: 'area', of: of || null }); return ' '; });
  s = s.replace(/(?:∠|угол\s+|угла\s+|величину\s+угла\s+|градусную\s+меру\s+угла\s+)([A-Z]{1,3})\b/g, (w, a) => { push({ kind: 'angle', angle: a }); return ' '; });
  s = s.replace(/(?:(?:длин[а-яА-Я]*\s+)?(?:отрез[а-яА-Я]*|сторон[а-яА-Я]*|основани[а-яА-Я]*|диагонал[а-яА-Я]*|высот[а-яА-Я]*|медиан[а-яА-Я]*|биссектрис[а-яА-Я]*|катет[а-яА-Я]*|гипотенуз[а-яА-Я]*)\s+)?([A-Z][0-9]?[A-Z][0-9]?)\b/g, (w, seg) => { push({ kind: 'length', seg }); return ' '; });
  // Слова без обозначений: «высоту», «гипотенузу», «диагональ» — оставим ИИ.
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
