[
description = "{info}"

field width = 14; field height = 12;
camera type = fixed;

// ---- Модель Пуанкаре в круге (родной объект компилятора draw Hyperbolic): «прямые» —
// геодезические (диаметры и дуги окружностей, ортогональных границе). Базовая прямая —
// горизонтальный диаметр. Точка A вне неё перетаскивается; через неё показаны обе
// параллели Лобачевского (общая идеальная точка с базовой прямой — жёлтые) и веер
// расходящихся прямых (синие, ползунок задаёт положение внутри открытого угла между
// параллелями — они тоже не пересекают базовую прямую). ----
new Point { name = "A"; pos = (1.2, 2.3); text = true("A"); pauseOnDrag = false }

draw Hyperbolic { name = "hBase"; model = disk; radius = radius; showBoundary = true; geodesics = geoBase() }
draw Hyperbolic { name = "hPar"; model = disk; radius = radius; showBoundary = false; geodesics = geoPar(); color = #f59e0b }
draw Hyperbolic { name = "hDiv"; model = disk; radius = radius; showBoundary = false; geodesics = geoDiv(); color = #3b82f6 }

// ---- Угол между параллелями при A (= удвоенный угол параллельности): касательные к обеим
// параллелям в точке A — по свойству ортогональной окружности они перпендикулярны отрезку
// от A до центра дуги, поэтому получаются поворотом на 90° радиус-вектора A − C. ----
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "tan1"; pos = (A, T1); color = "transparent"; interact = false }
new Line { name = "tan2"; pos = (A, T2); color = "transparent"; interact = false }
new Angle { name = "angP"; lines = (tan1, tan2) }
draw Angle { name = "arcP"; angle = "angP"; measure = false }

new UI { name = "sT"; type = slider; label = "положение расходящейся прямой"; variable = t; min = 0.06; max = 0.94; step = 0.01; default = 0.5 }

// ---- Логика ----
float radius = 5;
float t = 0.5;
float ax = 1.2; float ay = 2.3;
float d1x = 0; float d1y = 0; float d2x = 0; float d2y = 0; float d3x = 0; float d3y = 0;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

// Центр окружности, ортогональной единичному кругу (масштаба radius), проходящей через
// точку (ax,ay) и идеальную точку (px,py) на границе: из |C|² = r²+1 и прохождения через обе
// точки — линейная система C·P = radius², C·A = (radius² + ax² + ay²)/2.
Function s0() { return (radius * radius + ax * ax + ay * ay) / 2; }
Function det(px, py) { return px * ay - py * ax; }
Function ccx(px, py) { return (radius * radius * ay - py * s0()) / det(px, py); }
Function ccy(px, py) { return (px * s0() - radius * radius * ax) / det(px, py); }

// draw Hyperbolic ждёт координаты в единичном круге (масштаб radius умножается при рисовании) —
// делим все координаты на radius.
Function geoBase() { return [[[-1, 0], [1, 0]]]; }
Function geoPar() { return [[[ax / radius, ay / radius], [1, 0]], [[ax / radius, ay / radius], [-1, 0]]]; }
Function geoDiv() { return [[[ax / radius, ay / radius], [d1x / radius, d1y / radius]], [[ax / radius, ay / radius], [d2x / radius, d2y / radius]], [[ax / radius, ay / radius], [d3x / radius, d3y / radius]]]; }

Update {
  // A не выходит из открытого круга радиуса radius и не садится на базовую прямую (ось x) —
  // ограничение плавное: при выходе точка скользит вдоль границы круга.
  float r = sqrt(A.pos.x * A.pos.x + A.pos.y * A.pos.y);
  float lim = radius * 0.92;
  if (r > lim) { A.pos.x = A.pos.x * lim / r; A.pos.y = A.pos.y * lim / r; }
  if (abs(A.pos.y) < radius * 0.06) { A.pos.y = radius * 0.06 * (A.pos.y >= 0 ? 1 : -1); }
  ax = A.pos.x; ay = A.pos.y;

  // Касательные к параллелям (идеальные точки (±radius, 0)) в точке A: перпендикуляр к (A − C).
  float c1x = ccx(radius, 0); float c1y = ccy(radius, 0);
  float c2x = ccx(-radius, 0); float c2y = ccy(-radius, 0);
  T1.pos.x = ax - (ay - c1y); T1.pos.y = ay + (ax - c1x);
  T2.pos.x = ax - (ay - c2y); T2.pos.y = ay + (ax - c2x);

  // Веер расходящихся прямых: идеальные точки на той же дуге, что и A, между параллелями.
  float side = ay >= 0 ? 1 : -1;
  float ph = t * 3.14159265;
  d1x = radius * cos(side * ph); d1y = radius * sin(side * ph);
  float ph2 = max(0.06, t - 0.22) * 3.14159265;
  d2x = radius * cos(side * ph2); d2y = radius * sin(side * ph2);
  float ph3 = min(0.94, t + 0.22) * 3.14159265;
  d3x = radius * cos(side * ph3); d3y = radius * sin(side * ph3);

  info = "**Через точку A, не лежащую на данной прямой, проходит бесконечно много прямых, не пересекающих её.** Две крайние (жёлтые) — параллели Лобачевского: у них с данной прямой общая идеальная точка на абсолюте. Остальные (синие, ползунок двигает одну из них) — расходящиеся прямые.\n\n**Угол между параллелями при A** (вдвое больше угла параллельности) = " + num(angP.measure, 0) + "°: чем дальше A от данной прямой, тем этот угол меньше.";
}
]
