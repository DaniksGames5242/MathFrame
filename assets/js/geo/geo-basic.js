// assets/js/geo/geo-basic.js
// «Школьный» решатель геометрических задач по формулам — для условий без
// обозначений точек: «Сторона квадрата 5 см. Найдите периметр», «Катеты 3 и 4 —
// найдите гипотенузу», «Найдите площадь круга радиусом 3», «Сумма углов
// шестиугольника». Решает теми формулами, которые проходят в школе к этой теме
// (периметр квадрата — 4a, а не через синус), каждое действие поясняет словами,
// а если искомое находится несколькими способами — предлагает их на выбор.
//
//   solveBasic(text) → null | { ok, figure, steps:[{html}], answers, methods, unit, draw }

import { fmtNum } from './geo-reason.js';

const PI = Math.PI;
function num(v) {
  if (!Number.isFinite(v)) return '?';
  const kp = v / PI, r = Math.round(kp * 12) / 12;
  if (Math.abs(v) > 1e-9 && Math.abs(kp - r) < 1e-9 && Math.abs(v - Math.round(v)) > 1e-6) {
    const f = fmtNum(r).s;
    return (f === '1' ? '' : f) + 'π';
  }
  return fmtNum(v).s;
}
function approx(v) {
  const f = fmtNum(v);
  if (f.exact && !/[√π]/.test(num(v))) return '';
  return ' ≈ ' + String(+v.toFixed(2)).replace('.', ',');
}
const sin = d => Math.sin(d * PI / 180), cos = d => Math.cos(d * PI / 180);
const asin = x => Math.asin(x) * 180 / PI;

/* ---------------------------------------------------------------- фигуры
   Величина: [символ, название, род («length» | «area» | «angle» | «count»)].
   Формула: [искомое, [нужные величины], функция, запись с {подстановкой}, название способа]. */
const Q = {
  a: ['a', 'сторона', 'length'], b: ['b', 'вторая сторона', 'length'], c: ['c', 'третья сторона', 'length'],
  P: ['P', 'периметр', 'length'], S: ['S', 'площадь', 'area'], d: ['d', 'диагональ', 'length'],
  d1: ['d₁', 'первая диагональ', 'length'], d2: ['d₂', 'вторая диагональ', 'length'],
  h: ['h', 'высота', 'length'], m: ['m', 'средняя линия', 'length'], r: ['r', 'радиус вписанной окружности', 'length'],
  R: ['R', 'радиус описанной окружности', 'length'], al: ['α', 'угол', 'angle'], be: ['β', 'угол', 'angle'], ga: ['γ', 'угол', 'angle'],
  D: ['D', 'диаметр', 'length'], C: ['C', 'длина окружности', 'length'], n: ['n', 'число сторон', 'count'],
  sum: ['Σ', 'сумма углов', 'angle'], ang: ['φ', 'угол многоугольника', 'angle'], ext: ['ψ', 'внешний угол', 'angle'], s2: ['σ', 'сумма двух углов', 'angle'],
};
function F(out, ins, f, expr, name, why) { return { out, ins, f, expr, name, why }; }
const FIG = {
  square: { title: 'квадрат', q: { a: 'сторона квадрата' }, f: [
    F('P', ['a'], a => 4 * a, '4 · {a}', 'периметр квадрата', 'у квадрата 4 равные стороны'),
    F('a', ['P'], P => P / 4, '{P} : 4', 'сторона через периметр', 'у квадрата 4 равные стороны'),
    F('S', ['a'], a => a * a, '{a} · {a}', 'площадь квадрата', 'площадь квадрата равна квадрату стороны: S = a²'),
    F('a', ['S'], S => Math.sqrt(S), '√{S}', 'сторона через площадь', 'S = a², значит a = √S'),
    F('d', ['a'], a => a * Math.SQRT2, '{a} · √2', 'диагональ квадрата', 'по теореме Пифагора d² = a² + a² = 2a²'),
    F('a', ['d'], d => d / Math.SQRT2, '{d} : √2', 'сторона через диагональ', 'по теореме Пифагора d² = 2a²'),
    F('S', ['d'], d => d * d / 2, '{d} · {d} : 2', 'площадь через диагональ', 'площадь квадрата — половина квадрата диагонали (квадрат — это ромб с равными диагоналями)'),
    F('r', ['a'], a => a / 2, '{a} : 2', 'радиус вписанной окружности', 'вписанная окружность касается всех сторон, её диаметр равен стороне'),
    F('a', ['r'], r => 2 * r, '2 · {r}', 'сторона через радиус вписанной', 'диаметр вписанной окружности равен стороне'),
    F('R', ['d'], d => d / 2, '{d} : 2', 'радиус описанной окружности', 'центр описанной окружности — точка пересечения диагоналей, радиус — половина диагонали'),
    F('d', ['R'], R => 2 * R, '2 · {R}', 'диагональ через радиус описанной', 'диагональ — диаметр описанной окружности'),
  ] },
  rect: { title: 'прямоугольник', q: { a: 'длина', b: 'ширина' }, f: [
    F('P', ['a', 'b'], (a, b) => 2 * (a + b), '2 · ({a} + {b})', 'периметр прямоугольника', 'у прямоугольника противоположные стороны равны'),
    F('b', ['P', 'a'], (P, a) => P / 2 - a, '{P} : 2 − {a}', 'сторона через периметр', 'полупериметр — сумма двух соседних сторон'),
    F('a', ['P', 'b'], (P, b) => P / 2 - b, '{P} : 2 − {b}', 'сторона через периметр', 'полупериметр — сумма двух соседних сторон'),
    F('S', ['a', 'b'], (a, b) => a * b, '{a} · {b}', 'площадь прямоугольника', 'площадь прямоугольника равна произведению длины на ширину'),
    F('b', ['S', 'a'], (S, a) => S / a, '{S} : {a}', 'сторона через площадь', 'S = a · b, значит b = S : a'),
    F('a', ['S', 'b'], (S, b) => S / b, '{S} : {b}', 'сторона через площадь', 'S = a · b, значит a = S : b'),
    F('d', ['a', 'b'], (a, b) => Math.hypot(a, b), '√({a}² + {b}²)', 'диагональ по теореме Пифагора', 'диагональ — гипотенуза прямоугольного треугольника со сторонами-катетами'),
    F('b', ['d', 'a'], (d, a) => Math.sqrt(d * d - a * a), '√({d}² − {a}²)', 'сторона по теореме Пифагора', 'диагональ — гипотенуза, стороны — катеты'),
    F('a', ['d', 'b'], (d, b) => Math.sqrt(d * d - b * b), '√({d}² − {b}²)', 'сторона по теореме Пифагора', 'диагональ — гипотенуза, стороны — катеты'),
    F('R', ['d'], d => d / 2, '{d} : 2', 'радиус описанной окружности', 'центр описанной окружности — середина диагонали'),
    F('d', ['R'], R => 2 * R, '2 · {R}', 'диагональ через радиус', 'диагональ — диаметр описанной окружности'),
  ] },
  triangle: { title: 'треугольник', q: { a: 'сторона', b: 'сторона', c: 'сторона' }, f: [
    F('ga', ['al', 'be'], (x, y) => 180 - x - y, '180° − {al} − {be}', 'сумма углов треугольника', 'сумма углов треугольника равна 180°'),
    F('ga', ['s2'], s => 180 - s, '180° − {s2}', 'сумма углов треугольника', 'сумма углов треугольника равна 180°'),
    F('P', ['a', 'b', 'c'], (a, b, c) => a + b + c, '{a} + {b} + {c}', 'периметр треугольника', 'периметр — сумма длин всех сторон'),
    F('c', ['P', 'a', 'b'], (P, a, b) => P - a - b, '{P} − {a} − {b}', 'сторона через периметр', 'периметр — сумма длин всех сторон'),
    F('S', ['a', 'h'], (a, h) => a * h / 2, '{a} · {h} : 2', 'площадь через основание и высоту', 'площадь треугольника — половина произведения основания на высоту'),
    F('h', ['S', 'a'], (S, a) => 2 * S / a, '2 · {S} : {a}', 'высота через площадь', 'S = a · h : 2, значит h = 2S : a'),
    F('a', ['S', 'h'], (S, h) => 2 * S / h, '2 · {S} : {h}', 'основание через площадь', 'S = a · h : 2, значит a = 2S : h'),
    F('S', ['a', 'b', 'c'], (a, b, c) => { const p = (a + b + c) / 2; return Math.sqrt(p * (p - a) * (p - b) * (p - c)); }, '√(p(p − {a})(p − {b})(p − {c})), p = ({a} + {b} + {c}) : 2', 'формула Герона', 'по формуле Герона через полупериметр p'),
    F('S', ['a', 'b', 'ga'], (a, b, g) => a * b * sin(g) / 2, '{a} · {b} · sin {ga} : 2', 'площадь через две стороны и угол', 'площадь — половина произведения двух сторон на синус угла между ними'),
    F('c', ['a', 'b', 'ga'], (a, b, g) => Math.sqrt(a * a + b * b - 2 * a * b * cos(g)), '√({a}² + {b}² − 2 · {a} · {b} · cos {ga})', 'теорема косинусов', 'по теореме косинусов'),
  ] },
  right: { title: 'прямоугольный треугольник', q: { a: 'катет', b: 'катет', c: 'гипотенуза' }, f: [
    F('be', ['al'], a => 90 - a, '90° − {al}', 'сумма острых углов', 'сумма острых углов прямоугольного треугольника равна 90°'),
    F('c', ['a', 'b'], (a, b) => Math.hypot(a, b), '√({a}² + {b}²)', 'теорема Пифагора', 'по теореме Пифагора квадрат гипотенузы равен сумме квадратов катетов'),
    F('b', ['c', 'a'], (c, a) => Math.sqrt(c * c - a * a), '√({c}² − {a}²)', 'теорема Пифагора', 'по теореме Пифагора: b² = c² − a²'),
    F('a', ['c', 'b'], (c, b) => Math.sqrt(c * c - b * b), '√({c}² − {b}²)', 'теорема Пифагора', 'по теореме Пифагора: a² = c² − b²'),
    F('S', ['a', 'b'], (a, b) => a * b / 2, '{a} · {b} : 2', 'площадь через катеты', 'площадь прямоугольного треугольника — половина произведения катетов'),
    F('b', ['S', 'a'], (S, a) => 2 * S / a, '2 · {S} : {a}', 'катет через площадь', 'S = a · b : 2'),
    F('P', ['a', 'b', 'c'], (a, b, c) => a + b + c, '{a} + {b} + {c}', 'периметр', 'периметр — сумма длин сторон'),
    F('R', ['c'], c => c / 2, '{c} : 2', 'радиус описанной окружности', 'центр описанной окружности прямоугольного треугольника — середина гипотенузы'),
    F('c', ['R'], R => 2 * R, '2 · {R}', 'гипотенуза через радиус', 'гипотенуза — диаметр описанной окружности'),
    F('r', ['a', 'b', 'c'], (a, b, c) => (a + b - c) / 2, '({a} + {b} − {c}) : 2', 'радиус вписанной окружности', 'для прямоугольного треугольника r = (a + b − c) : 2'),
    F('h', ['a', 'b', 'c'], (a, b, c) => a * b / c, '{a} · {b} : {c}', 'высота к гипотенузе', 'площадь, посчитанная двумя способами: a · b = c · h'),
    F('b', ['a', 'al'], (a, x) => a * Math.tan((90 - x) * PI / 180), '{a} · tg(90° − {al})', 'катет через угол', 'тангенс острого угла — отношение противолежащего катета к прилежащему'),
  ] },
  iso: { title: 'равнобедренный треугольник', q: { a: 'основание', b: 'боковая сторона' }, f: [
    F('al', ['be'], b => (180 - b) / 2, '(180° − {be}) : 2', 'углы при основании', 'углы при основании равнобедренного треугольника равны, а сумма углов — 180°'),
    F('be', ['al'], a => 180 - 2 * a, '180° − 2 · {al}', 'угол при вершине', 'сумма углов треугольника 180°, углы при основании равны'),
    F('h', ['a', 'b'], (a, b) => Math.sqrt(b * b - a * a / 4), '√({b}² − ({a} : 2)²)', 'высота к основанию по теореме Пифагора', 'высота к основанию — и медиана: делит основание пополам'),
    F('b', ['a', 'h'], (a, h) => Math.hypot(a / 2, h), '√(({a} : 2)² + {h}²)', 'боковая сторона по теореме Пифагора', 'высота к основанию делит его пополам'),
    F('a', ['b', 'h'], (b, h) => 2 * Math.sqrt(b * b - h * h), '2 · √({b}² − {h}²)', 'основание по теореме Пифагора', 'высота к основанию делит его пополам'),
    F('P', ['a', 'b'], (a, b) => a + 2 * b, '{a} + 2 · {b}', 'периметр', 'боковые стороны равны'),
    F('b', ['P', 'a'], (P, a) => (P - a) / 2, '({P} − {a}) : 2', 'боковая сторона через периметр', 'боковые стороны равны'),
    F('a', ['P', 'b'], (P, b) => P - 2 * b, '{P} − 2 · {b}', 'основание через периметр', 'боковые стороны равны'),
    F('S', ['a', 'h'], (a, h) => a * h / 2, '{a} · {h} : 2', 'площадь через основание и высоту', 'площадь треугольника — половина произведения основания на высоту'),
  ] },
  equi: { title: 'равносторонний треугольник', q: { a: 'сторона' }, f: [
    F('P', ['a'], a => 3 * a, '3 · {a}', 'периметр', 'все стороны равны'),
    F('a', ['P'], P => P / 3, '{P} : 3', 'сторона через периметр', 'все стороны равны'),
    F('h', ['a'], a => a * Math.sqrt(3) / 2, '{a} · √3 : 2', 'высота', 'по теореме Пифагора: h² = a² − (a : 2)²'),
    F('a', ['h'], h => 2 * h / Math.sqrt(3), '2 · {h} : √3', 'сторона через высоту', 'h = a√3 : 2'),
    F('S', ['a'], a => a * a * Math.sqrt(3) / 4, '{a}² · √3 : 4', 'площадь равностороннего треугольника', 'S = a²√3 : 4'),
    F('S', ['a', 'h'], (a, h) => a * h / 2, '{a} · {h} : 2', 'площадь через основание и высоту', 'половина произведения стороны на высоту'),
    F('R', ['a'], a => a / Math.sqrt(3), '{a} : √3', 'радиус описанной окружности', 'R = a : √3 (две трети высоты)'),
    F('r', ['a'], a => a / (2 * Math.sqrt(3)), '{a} : (2√3)', 'радиус вписанной окружности', 'r = a : (2√3) (треть высоты)'),
  ] },
  rhomb: { title: 'ромб', q: { a: 'сторона ромба' }, f: [
    F('P', ['a'], a => 4 * a, '4 · {a}', 'периметр ромба', 'у ромба все стороны равны'),
    F('a', ['P'], P => P / 4, '{P} : 4', 'сторона через периметр', 'у ромба все стороны равны'),
    F('S', ['d1', 'd2'], (x, y) => x * y / 2, '{d1} · {d2} : 2', 'площадь через диагонали', 'площадь ромба — половина произведения диагоналей'),
    F('d2', ['S', 'd1'], (S, x) => 2 * S / x, '2 · {S} : {d1}', 'диагональ через площадь', 'S = d₁ · d₂ : 2'),
    F('a', ['d1', 'd2'], (x, y) => Math.hypot(x / 2, y / 2), '√(({d1} : 2)² + ({d2} : 2)²)', 'сторона по теореме Пифагора', 'диагонали ромба перпендикулярны и делятся точкой пересечения пополам'),
    F('d2', ['a', 'd1'], (a, x) => 2 * Math.sqrt(a * a - x * x / 4), '2 · √({a}² − ({d1} : 2)²)', 'диагональ по теореме Пифагора', 'диагонали перпендикулярны и делятся пополам'),
    F('S', ['a', 'h'], (a, h) => a * h, '{a} · {h}', 'площадь через сторону и высоту', 'ромб — параллелограмм: S = a · h'),
    F('h', ['S', 'a'], (S, a) => S / a, '{S} : {a}', 'высота через площадь', 'S = a · h'),
    F('S', ['a', 'al'], (a, x) => a * a * sin(x), '{a}² · sin {al}', 'площадь через сторону и угол', 'S = a² · sin α'),
    F('be', ['al'], x => 180 - x, '180° − {al}', 'соседний угол', 'сумма углов, прилежащих к одной стороне, равна 180°'),
  ] },
  para: { title: 'параллелограмм', q: { a: 'сторона', b: 'сторона' }, f: [
    F('be', ['al'], x => 180 - x, '180° − {al}', 'соседний угол', 'сумма углов параллелограмма, прилежащих к одной стороне, равна 180°, а противоположные углы равны'),
    F('P', ['a', 'b'], (a, b) => 2 * (a + b), '2 · ({a} + {b})', 'периметр', 'противоположные стороны параллелограмма равны'),
    F('b', ['P', 'a'], (P, a) => P / 2 - a, '{P} : 2 − {a}', 'сторона через периметр', 'полупериметр — сумма соседних сторон'),
    F('S', ['a', 'h'], (a, h) => a * h, '{a} · {h}', 'площадь через сторону и высоту', 'площадь параллелограмма — произведение стороны на высоту к ней'),
    F('h', ['S', 'a'], (S, a) => S / a, '{S} : {a}', 'высота через площадь', 'S = a · h'),
    F('S', ['a', 'b', 'al'], (a, b, x) => a * b * sin(x), '{a} · {b} · sin {al}', 'площадь через стороны и угол', 'S = a · b · sin α'),
    F('h', ['b', 'al'], (b, x) => b * sin(x), '{b} · sin {al}', 'высота из прямоугольного треугольника', 'высота — катет против угла α в треугольнике с гипотенузой b'),
  ] },
  trap: { title: 'трапеция', q: { a: 'основание', b: 'основание' }, f: [
    F('m', ['a', 'b'], (a, b) => (a + b) / 2, '({a} + {b}) : 2', 'средняя линия', 'средняя линия трапеции равна полусумме оснований'),
    F('b', ['m', 'a'], (m, a) => 2 * m - a, '2 · {m} − {a}', 'основание через среднюю линию', 'm = (a + b) : 2'),
    F('S', ['a', 'b', 'h'], (a, b, h) => (a + b) / 2 * h, '({a} + {b}) : 2 · {h}', 'площадь трапеции', 'площадь трапеции — полусумма оснований, умноженная на высоту'),
    F('S', ['m', 'h'], (m, h) => m * h, '{m} · {h}', 'площадь через среднюю линию', 'S = m · h'),
    F('h', ['S', 'a', 'b'], (S, a, b) => 2 * S / (a + b), '2 · {S} : ({a} + {b})', 'высота через площадь', 'S = (a + b) : 2 · h'),
    F('h', ['S', 'm'], (S, m) => S / m, '{S} : {m}', 'высота через площадь', 'S = m · h'),
    F('P', ['a', 'b', 'c'], (a, b, c) => a + b + 2 * c, '{a} + {b} + 2 · {c}', 'периметр равнобедренной трапеции', 'боковые стороны равны'),
    F('h', ['a', 'b', 'c'], (a, b, c) => Math.sqrt(c * c - (a - b) * (a - b) / 4), '√({c}² − (({a} − {b}) : 2)²)', 'высота по теореме Пифагора', 'высота отсекает от большего основания отрезок (a − b) : 2 (трапеция равнобедренная)'),
  ] },
  circle: { title: 'окружность', q: { r: 'радиус' }, f: [
    F('D', ['r'], r => 2 * r, '2 · {r}', 'диаметр', 'диаметр — два радиуса'),
    F('r', ['D'], D => D / 2, '{D} : 2', 'радиус через диаметр', 'радиус — половина диаметра'),
    F('C', ['r'], r => 2 * PI * r, '2π · {r}', 'длина окружности', 'длина окружности C = 2πr'),
    F('r', ['C'], C => C / (2 * PI), '{C} : (2π)', 'радиус через длину окружности', 'C = 2πr'),
    F('S', ['r'], r => PI * r * r, 'π · {r}²', 'площадь круга', 'площадь круга S = πr²'),
    F('r', ['S'], S => Math.sqrt(S / PI), '√({S} : π)', 'радиус через площадь', 'S = πr²'),
  ] },
  poly: { title: 'многоугольник', q: { a: 'сторона' }, f: [
    F('sum', ['n'], n => 180 * (n - 2), '180° · ({n} − 2)', 'сумма углов многоугольника', 'сумма углов выпуклого n-угольника равна 180° · (n − 2)'),
    F('ang', ['sum', 'n'], (s, n) => s / n, '{sum} : {n}', 'угол правильного многоугольника', 'у правильного многоугольника все углы равны'),
    F('ext', ['ang'], x => 180 - x, '180° − {ang}', 'внешний угол', 'внешний угол — смежный с внутренним'),
    F('n', ['ang'], x => 360 / (180 - x), '360° : (180° − {ang})', 'число сторон', 'сумма внешних углов многоугольника — 360°'),
    F('P', ['n', 'a'], (n, a) => n * a, '{n} · {a}', 'периметр правильного многоугольника', 'все стороны равны'),
    F('a', ['P', 'n'], (P, n) => P / n, '{P} : {n}', 'сторона через периметр', 'все стороны равны'),
  ] },
};

/* ---------------------------------------------------------------- разбор */
const NUMW = { трех: 3, тре: 3, четырех: 4, пяти: 5, шести: 6, семи: 7, восьми: 8, девяти: 9, десяти: 10, двенадцати: 12, двадцати: 20 };
function figureOf(t) {
  let m;
  if ((m = t.match(/(\d+)\s*-?\s*угольник/))) return { fig: 'poly', n: +m[1] };
  if ((m = t.match(/(пяти|шести|семи|восьми|девяти|десяти|двенадцати|двадцати)угольник/))) return { fig: 'poly', n: NUMW[m[1]] };
  if (/многоугольник/.test(t)) return { fig: 'poly' };
  if (/прямоугольн\S*\s+треугольн|треугольн\S*\s+(?:\S+\s+){0,3}прямоугольн|прямой угол|гипотенуз|катет/.test(t)) return { fig: 'right' };
  if (/равносторонн\S*\s+треугольн|правильн\S*\s+треугольн/.test(t)) return { fig: 'equi' };
  if (/равнобедренн\S*\s+треугольн/.test(t)) return { fig: 'iso' };
  if (/треугольн/.test(t)) return { fig: 'triangle' };
  if (/квадрат(?!н)/.test(t)) return { fig: 'square' };
  if (/прямоугольник/.test(t)) return { fig: 'rect' };
  if (/ромб/.test(t)) return { fig: 'rhomb' };
  if (/параллелограмм/.test(t)) return { fig: 'para' };
  if (/трапеци/.test(t)) return { fig: 'trap' };
  if (/окружност|круг|радиус|диаметр/.test(t)) return { fig: 'circle' };
  return null;
}
// Слово в условии → величина (с учётом фигуры). second — для «второй/другой».
function keyOf(w, fig, ctx) {
  const t = w;
  if (/^периметр/.test(t)) return 'P';
  if (/^площад/.test(t)) return 'S';
  if (/^средн\S* лини/.test(t)) return 'm';
  if (/^диаметр/.test(t)) return 'D';
  if (/^(длин\S* окружност|длин\S* круг)/.test(t)) return 'C';
  if (/^радиус/.test(t)) return /вписан/.test(ctx) ? 'r' : /описан/.test(ctx) ? 'R' : fig === 'circle' ? 'r' : (/вписан/.test(ctx) ? 'r' : 'R');
  if (/^гипотенуз/.test(t)) return 'c';
  if (/^катет/.test(t)) return 'a*';
  if (/^диагонал/.test(t)) return fig === 'rhomb' ? 'd*' : 'd';
  if (/^высот/.test(t)) return 'h';
  if (/^боков/.test(t)) return fig === 'trap' ? 'c' : 'b';
  if (/^основани/.test(t)) return fig === 'trap' ? 'a*' : 'a';
  if (/^длин/.test(t)) return 'a';
  if (/^ширин/.test(t)) return 'b';
  if (/^сумм\S* двух угл/.test(t)) return 's2';
  if (/^сумм\S* угл/.test(t)) return 'sum';
  if (/^внешн\S* угол/.test(t)) return 'ext';
  if (/^угол при вершин/.test(t)) return 'be';
  if (/^(угол|угл\S*) при основани/.test(t)) return 'al';
  if (/^(угол|угл)/.test(t)) return fig === 'poly' ? 'ang' : 'al*';
  if (/^(другую|вторую|третью) сторон/.test(t)) return fig === 'triangle' ? 'c' : 'b';
  if (/^сторон/.test(t)) return fig === 'rect' || fig === 'para' || fig === 'triangle' ? 'a*' : 'a';
  return null;
}
const KW = /(?<![а-яa-z])(периметр\S*|площад\S*|средн\S* лини\S*|диаметр\S*|длин\S* (?:окружност|круг)\S*|радиус\S*|гипотенуз\S*|катет\S*|диагонал\S*|высот\S*|боков\S* сторон\S*|основани\S*(?! трапец)|длин\S*|ширин\S*|сумм\S* двух угл\S*|сумм\S* угл\S*|внешн\S* угол|угол при вершин\S*|(?:угол|угл\S*) при основани\S*|(?:другую|вторую|третью) сторон\S*|сторон\S*|угол|углы|угла|углов)/g;
const SEQ = { 'a*': { rect: ['a', 'b'], para: ['a', 'b'], triangle: ['a', 'b', 'c'], right: ['a', 'b'], trap: ['a', 'b'] }, 'd*': { rhomb: ['d1', 'd2'] }, 'al*': { triangle: ['al', 'be', 'ga'], right: ['al', 'be'], para: ['al', 'be'], rhomb: ['al', 'be'], iso: ['al', 'be'] } };
function unitOf(t) { const m = t.match(/\d\s*(мм|см|дм|км|м)(?![а-я])/); return m ? m[1] : ''; }

export function parseBasic(text) {
  let t = String(text || '').toLowerCase().replace(/ё/g, 'е').replace(/(\d),(\d)/g, '$1.$2').replace(/\s+/g, ' ');
  if (/(^|[^A-Za-z])[A-Z][A-Z0-9]*[A-Z]([^A-Za-z]|$)|(^|\s)[A-Z]\d?(\s|[,.]|$)/.test(String(text))) return null;   // точки ABC — это задача для основного решателя
  const fg = figureOf(t);
  if (!fg) return null;
  const fig = fg.fig;
  const fstart = t.search(/найд|найти|вычисл|чему равн|определ|сколько|какова|каков|каково/);
  if (fstart < 0) return null;
  const known = {}, rel = [], order = [], find = [];
  if (fg.n) known.n = fg.n;
  const assign = (key, v) => {
    if (SEQ[key]) {
      const seq = SEQ[key][fig] || [key.slice(0, -1)];
      const k = seq.find(s => known[s] === undefined) || seq[seq.length - 1];
      known[k] = v; order.push(k); return k;
    }
    known[key] = v; order.push(key); return key;
  };
  // Слово-величина, за ним — числа (или «в 3 раза меньше»). Слово без числа
  // в части «найдите …» — искомое.
  const re = new RegExp(KW.source + '|(?:\\d+(?:\\.\\d+)?\\s*)?√\\s*\\(?\\d+(?:\\.\\d+)?\\)?|\\d+(?:\\.\\d+)?|в \\d+(?:\\.\\d+)? раза? (?:больше|меньше|длиннее|короче)|на \\d+(?:\\.\\d+)? \\S+ (?:больше|меньше|длиннее|короче)|[.;?!]|,? если|,? а |,? и ', 'g');
  const toks = []; let mt;
  while ((mt = re.exec(t))) toks.push({ w: mt[0], i: mt.index });
  let cur = null, last = null;
  const flush = () => {
    if (cur && !cur.got && cur.i >= fstart && !/(?:^|\s)(к|ко|на|в|около|о)\s*$/.test(t.slice(Math.max(0, cur.i - 4), cur.i))) {
      let key = cur.key;
      const ctx = t.slice(cur.i, cur.i + 60);
      if (/остальн/.test(t.slice(fstart)) && /^угл/.test(cur.w)) key = 'be';
      if (SEQ[key]) { const seq = SEQ[key][fig] || [key.slice(0, -1)]; key = seq.find(s => known[s] === undefined && !find.includes(s)) || seq[0]; }
      if (key === 'r' || key === 'R') key = fig === 'circle' && !/вписан|описан/.test(ctx) ? 'r' : /вписан/.test(ctx) ? 'r' : /описан/.test(ctx) ? 'R' : key;
      if (!find.includes(key)) find.push(key);
    }
    cur = null;
  };
  for (const tk of toks) {
    const w = tk.w.trim();
    if (/^([.;?!]|,? ?если|,? ?а|,? ?и)$/.test(w) || /^(если|а|и)$/.test(w.replace(/^,\s*/, ''))) { if (!(cur && cur.got && SEQ[cur.key] && /и$/.test(w))) flush(); continue; }
    const mRel = w.match(/^(в|на) (\d+(?:\.\d+)?)/);
    if (mRel && cur && last && !['P', 'S', 'sum', 's2', 'm'].includes(last) && Q[last] && Q[cur.key.replace('*', '')] && Q[last][2] === Q[cur.key.replace('*', '')][2]) {
      const k = +mRel[2], up = /больше|длиннее/.test(w);
      const key = SEQ[cur.key] ? (SEQ[cur.key][fig] || []).find(s => known[s] === undefined) || cur.key : cur.key;
      known[key] = mRel[1] === 'в' ? (up ? known[last] * k : known[last] / k) : (up ? known[last] + k : known[last] - k);
      order.push(key); rel.push({ key, from: last, k, mul: mRel[1] === 'в', up });
      cur.got = true; continue;
    }
    if (/^[\d√]/.test(w)) {
      if (!cur || (cur.got && !SEQ[cur.key])) continue;
      const mr = w.match(/^(\d+(?:\.\d+)?)?\s*√\s*\(?(\d+(?:\.\d+)?)/);
      const val = mr ? (mr[1] ? +mr[1] : 1) * Math.sqrt(+mr[2]) : +w;
      let key = cur.key;
      if (key === 'r' || key === 'R') { const ctx = t.slice(Math.max(0, cur.i - 40), tk.i); key = fig === 'circle' && !/вписан|описан/.test(ctx) ? 'r' : /вписан/.test(ctx) ? 'r' : 'R'; }
      last = assign(key, val); cur.got = true;
      continue;
    }
    flush();
    const key = keyOf(w, fig, t.slice(tk.i, tk.i + 60));
    if (key) cur = { key, w, i: tk.i, got: false };
  }
  flush();
  // связи между неизвестными («на 4 больше другой», «относятся как 3 : 4») — для основного решателя
  if (/относ|больше|меньше|длиннее|короче|разност|сумм[аеы] (?!(?:двух |всех )?угл)/.test(t) && rel.length === 0) return null;
  // «треугольник: угол A, угол B → найти третий угол»
  if (fig === 'triangle') find.forEach((k, i) => { if ((k === 'al' || k === 'be') && (known[k] !== undefined || known.s2 !== undefined)) find[i] = 'ga'; });
  if (fig === 'iso') find.forEach((k, i) => { if (k === 'al' && known.al !== undefined) find[i] = 'be'; });
  if (!find.length || (!Object.keys(known).length)) return null;
  return { fig, known, find, rel, unit: unitOf(t), order };
}

/* ---------------------------------------------------------------- решение */
function unitFor(kind, unit) { return kind === 'angle' ? '°' : kind === 'count' ? '' : kind === 'area' ? (unit ? ' ' + unit + '²' : '') : (unit ? ' ' + unit : ''); }
function sym(k) { return Q[k] ? Q[k][0] : k; }
function fmtVal(k, v, unit) { const kind = Q[k] ? Q[k][2] : 'length'; return kind === 'angle' ? num(v) + '°' : num(v) + unitFor(kind, unit); }
function derive(formulas, known0, target, banned) {
  const known = Object.assign({}, known0), how = {};
  let changed = true;
  while (changed && known[target] === undefined) {
    changed = false;
    for (const f of formulas) {
      if (known[f.out] !== undefined || (banned && banned.has(f))) continue;
      if (!f.ins.every(k => known[k] !== undefined)) continue;
      const v = f.f.apply(null, f.ins.map(k => known[k]));
      if (!Number.isFinite(v) || v <= 0) continue;
      known[f.out] = v; how[f.out] = f; changed = true;
      if (f.out === target) break;
    }
  }
  if (known[target] === undefined) return null;
  // только нужные шаги, в порядке вывода
  const need = [], seen = new Set();
  (function walk(k) { const f = how[k]; if (!f || seen.has(k)) return; seen.add(k); f.ins.forEach(walk); need.push(f); })(target);
  return { known, steps: need };
}
function stepHtml(f, known, unit, figTitle) {
  const sub = f.expr.replace(/\{(\w+)\}/g, (m, k) => { const v = num(known[k]); return Q[k] && Q[k][2] === 'angle' ? v + '°' : v; });
  const symb = f.expr.replace(/\{(\w+)\}/g, (m, k) => sym(k));
  const v = known[f.out];
  const showSym = symb !== sub;
  return '<b>' + f.name[0].toUpperCase() + f.name.slice(1) + '</b>: ' + f.why + '. ' + sym(f.out) + ' = ' + (showSym ? symb + ' = ' : '') + sub + ' = <b>' + fmtVal(f.out, v, unit) + '</b>' + approx(v) + '.';
}

export function solveBasic(text) {
  const pb = parseBasic(text);
  if (!pb) return null;
  const def = FIG[pb.fig];
  const unit = pb.unit;
  const known0 = pb.known;
  // общий вывод для всех искомых; способы — для последнего искомого
  const intro = [];
  const givenList = Object.keys(known0).filter(k => k !== 'n' || pb.fig === 'poly').map(k => sym(k) + ' = ' + fmtVal(k, known0[k], unit));
  intro.push({ html: 'Дано: ' + def.title + (pb.fig === 'poly' && known0.n ? ' (n = ' + known0.n + ')' : '') + ', ' + givenList.join(', ') + '.' });
  pb.rel.forEach(r => intro.push({ html: sym(r.key) + (r.mul ? ' = ' + sym(r.from) + (r.up ? ' · ' : ' : ') : ' = ' + sym(r.from) + (r.up ? ' + ' : ' − ')) + num(r.k) + ' = ' + fmtVal(r.key, known0[r.key], unit) + ' — по условию.' }));
  const methods = [];
  const sigs = new Set();
  const tryOnce = banned => {
    let known = Object.assign({}, known0), all = [];
    for (const tg of pb.find) {
      if (known[tg] !== undefined && known0[tg] === undefined) continue;
      if (known0[tg] !== undefined) return null;
      const d = derive(def.f, known, tg, banned);
      if (!d) return null;
      d.steps.forEach(s => { if (!all.includes(s)) all.push(s); });
      known = d.known;
    }
    return { known, steps: all };
  };
  const first = tryOnce(null);
  if (!first) return null;
  const add = s => { const sig = s.steps.map(f => def.f.indexOf(f)).join(','); if (sigs.has(sig)) return; sigs.add(sig); methods.push(s); };
  add(first);
  // другие способы: запрещаем по одной формуле из найденного решения
  for (const f of first.steps) {
    const alt = tryOnce(new Set([f]));
    if (alt && pb.find.every(k => Math.abs(alt.known[k] - first.known[k]) < 1e-6 * Math.max(1, first.known[k]))) add(alt);
    if (methods.length >= 4) break;
  }
  const out = methods.map(m => {
    const steps = intro.concat(m.steps.map(f => ({ html: stepHtml(f, m.known, unit, def.title) })));
    const answers = pb.find.map(k => ({ name: sym(k) + ' (' + (Q[k] ? Q[k][1] : k) + ')', value: m.known[k], unit: Q[k] && Q[k][2] === 'angle' ? '°' : Q[k] && Q[k][2] === 'area' ? (unit ? unit + '²' : '') : Q[k] && Q[k][2] === 'count' ? '' : unit, text: sym(k) + ' = ' + fmtVal(k, m.known[k], unit) + approx(m.known[k]) }));
    return { m, steps, answers };
  }).map((x, i, all) => {
    const other = all[i ? 0 : 1];
    const own = other ? x.m.steps.filter(f => !other.m.steps.includes(f)) : x.m.steps;
    const pick = (own.length ? own : x.m.steps).slice(-2).map(f => f.name);
    return { label: pick.join(', '), steps: x.steps, answers: x.answers };
  });
  return { ok: true, source: 'basic', method: 'basic', figure: pb.fig, parsed: pb, steps: out[0].steps, answers: out[0].answers, methods: out, notes: [], unit, draw: drawIr(pb, methods[0].known) };
}

// Условие для чертежа в формате основного решателя (если фигуру можно построить)
function drawIr(pb, k) {
  const L = (seg, v) => ({ kind: 'length', seg, value: v });
  const A = (ang, v) => ({ kind: 'angle', angle: ang, value: v });
  const fig = pb.fig;
  if (fig === 'square' && k.a) return { figure: { type: 'square', vertices: ['A', 'B', 'C', 'D'] }, given: [L('AB', k.a)], constructions: [], find: [{ kind: 'length', seg: 'AB' }], unit: pb.unit };
  if (fig === 'rect' && k.a && k.b) return { figure: { type: 'rectangle', vertices: ['A', 'B', 'C', 'D'] }, given: [L('AD', k.a), L('AB', k.b)], constructions: [], find: [{ kind: 'length', seg: 'AB' }], unit: pb.unit };
  if (fig === 'rhomb' && k.a) return { figure: { type: 'rhombus', vertices: ['A', 'B', 'C', 'D'] }, given: [L('AB', k.a)].concat(k.d1 ? [L('AC', Math.max(k.d1, k.d2 || 0))] : k.al ? [A('A', Math.min(k.al, 180 - k.al))] : [A('A', 60)]), constructions: [], find: [{ kind: 'length', seg: 'AB' }], unit: pb.unit };
  if (fig === 'para' && k.a && k.b) return { figure: { type: 'parallelogram', vertices: ['A', 'B', 'C', 'D'] }, given: [L('AD', k.a), L('AB', k.b), A('A', k.al ? Math.min(k.al, 180 - k.al) : 60)], constructions: [], find: [{ kind: 'length', seg: 'AB' }], unit: pb.unit };
  if (fig === 'right' && k.a && k.b) return { figure: { type: 'triangle', vertices: ['A', 'B', 'C'], right: 'C' }, given: [L('AC', k.a), L('BC', k.b), A('C', 90)], constructions: [], find: [{ kind: 'length', seg: 'AB' }], unit: pb.unit };
  if (fig === 'iso' && k.a && k.b) return { figure: { type: 'triangle', vertices: ['A', 'B', 'C'] }, given: [L('AC', k.a), L('AB', k.b), L('BC', k.b)], constructions: [], find: [{ kind: 'length', seg: 'AC' }], unit: pb.unit };
  if (fig === 'equi' && k.a) return { figure: { type: 'triangle', vertices: ['A', 'B', 'C'] }, given: [L('AB', k.a), L('BC', k.a), L('AC', k.a)], constructions: [], find: [{ kind: 'length', seg: 'AC' }], unit: pb.unit };
  if (fig === 'triangle' && k.a && k.b && k.c) return { figure: { type: 'triangle', vertices: ['A', 'B', 'C'] }, given: [L('BC', k.a), L('AC', k.b), L('AB', k.c)], constructions: [], find: [{ kind: 'length', seg: 'AB' }], unit: pb.unit };
  if (fig === 'triangle' && k.al && k.be) return { figure: { type: 'triangle', vertices: ['A', 'B', 'C'] }, given: [A('A', k.al), A('B', k.be), L('AB', 6)], constructions: [], find: [{ kind: 'angle', angle: 'C' }], unit: '' };
  if (fig === 'trap' && k.a && k.b) { const big = Math.max(k.a, k.b), sm = Math.min(k.a, k.b); return { figure: { type: 'trapezoid', vertices: ['A', 'B', 'C', 'D'], bases: ['AD', 'BC'], isosceles: true }, given: [L('AD', big), L('BC', sm)].concat(k.h ? [{ kind: 'length', seg: 'BH', value: k.h }] : [A('A', 60)]), constructions: k.h ? [{ kind: 'altitude', vertex: 'B', target: 'AD', point: 'H' }] : [], find: [{ kind: 'length', seg: 'AD' }], unit: pb.unit }; }
  return null;
}
