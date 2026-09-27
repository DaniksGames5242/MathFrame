[
description = "{info}"

field width = 20;
field height = 10;
camera type = fixed;
show axis x = true;

// ---- Числовая прямая: невидимая направляющая, по которой ходят точки ----
new Point { name = "L1"; pos = (-9.5, 0); dynamic = false; active = false }
new Point { name = "L2"; pos = (9.5, 0); dynamic = false; active = false }
new Line { name = "axisLine"; pos = (L1, L2); active = false; interact = false }

new Point { name = "O"; pos = (0, 0); dynamic = false; size = 0.6; collision = false }

// ---- Вкладка 1: модуль — расстояние до нуля; у противоположных чисел модули равны ----
// Пара противоположных чисел: обе точки перетаскиваются, вторая зеркалится относительно
// нуля в Update. Подписи — сами значения чисел (буквенные «x» и «−x» путали бы: при
// отрицательном x точка «−x» оказывается справа).
new Point { name = "X"; line = "axisLine"; t = 0.6789; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "NX"; line = "axisLine"; t = 0.3211; pauseOnDrag = false; collideWithPoints = false }
new Line { name = "ox"; pos = (O, X); color = #3b82f6; thickness = 4; interact = false; layer = 12 }
new Line { name = "onx"; pos = (O, NX); color = #3b82f6; thickness = 4; interact = false; layer = 12 }
draw EquallySing { name = "eqOx"; edges = (ox, onx); type = 1 }
draw Text { name = "lblX"; pos = (X.pos.x, 0.7); text = num(X.pos.x) }
draw Text { name = "lblNX"; pos = (NX.pos.x, 0.7); text = num(NX.pos.x) }

new Claster { name = "tabAbs"; elements = (X, NX, ox, onx, eqOx, lblX, lblNX); active = true }

// ---- Вкладка 2: |a − b| — расстояние между точками ----
new Point { name = "Pa"; line = "axisLine"; t = 0.3421; text = true("a"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Pb"; line = "axisLine"; t = 0.7632; text = true("b"); pauseOnDrag = false; collideWithPoints = false }
new Line { name = "ab"; pos = (Pa, Pb); color = #f59e0b; thickness = 4; interact = false; layer = 12 }
draw Text { name = "lblAB"; pos = ((Pa.pos.x + Pb.pos.x) / 2, 0.8); text = "|a − b|" }

new Claster { name = "tabDist"; elements = (Pa, Pb, ab, lblAB); active = false }

// ---- Вкладка 3: график y = k·|x − a| + b ----
// Вершина V лежит на графике: перетаскивая её, сдвигаем «галочку» (a, b — координаты V).
// Точка K на правой ветви задаёт наклон ветвей k (угол, под которым график «отражается»
// от вершины). Точка M скользит по графику и показывает значение.
float ga = 0;
float gb = 0;
float gk = 1;
float kdx = 3;
float pVx = 0; float pVy = 0; float pKx = 3; float pKy = 3;
func fabs(x) = gk * abs(x - ga) + gb;
draw Function { name = "grAbs"; f = "fabs"; xmin = -10; xmax = 10; segments = 400; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "V"; pos = (0, 0); text = true("V"); pauseOnDrag = false }
new Point { name = "K"; pos = (3, 3); text = true("K"); pauseOnDrag = false }
new Point { name = "P"; graph = "grAbs"; t = 0.3; text = true("M"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Px"; pos = (0, 0); dynamic = false; size = 0.6; collision = false }
new Point { name = "Py"; pos = (0, 0); dynamic = false; size = 0.6; collision = false }
new Line { name = "pPx"; pos = (P, Px); active = false; interact = false }
new Line { name = "pPy"; pos = (P, Py); active = false; interact = false }
draw Punctir { name = "prX"; edge = "pPx" }
draw Punctir { name = "prY"; edge = "pPy" }
new Point { name = "Y1"; pos = (0, -4.8); dynamic = false; active = false }
new Point { name = "Y2"; pos = (0, 4.8); dynamic = false; active = false }
new Line { name = "yAxis"; pos = (Y1, Y2); interact = false; thickness = 1 }

new Claster { name = "tabGraph"; elements = (grAbs, V, K, P, Px, Py, prX, prY, yAxis); active = false }

// ---- Кнопки вкладок ----
new UI { name = "btnAbs"; type = button; label = "Модуль числа"; action = "tab = 1; tabAbs.active = true; tabDist.active = false; tabGraph.active = false" }
new UI { name = "btnDist"; type = button; label = "Расстояние |a − b|"; action = "tab = 2; tabAbs.active = false; tabDist.active = true; tabGraph.active = false" }
new UI { name = "btnGraph"; type = button; label = "График"; action = "tab = 3; tabAbs.active = false; tabDist.active = false; tabGraph.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float ptX = 0;
float ptNX = 0;

// Число с одним знаком после запятой и настоящим знаком минус; numP — отрицательное
// в скобках, для подстановки в выражения
Function num(v) {
  float r = round(v * 10) / 10;
  if (r < 0) { return "−" + format(abs(r), 1); }
  return format(abs(r), 1);
}
Function numP(v) {
  if (round(v * 10) / 10 < 0) { return "(" + num(v) + ")"; }
  return num(v);
}

// Формула текущего графика: y = |x − a| + b с аккуратными знаками
Function graphFormula() {
  float a = round(ga * 10) / 10; float b = round(gb * 10) / 10;
  string inner = "x";
  if (a > 0) { inner = "x − " + num(a); }
  if (a < 0) { inner = "x + " + num(-a); }
  float k = round(gk * 10) / 10;
  string f = "|" + inner + "|";
  if (k == -1) { f = "−" + f; }
  if (k != 1 && k != -1) { f = num(k) + "·" + f; }
  if (b > 0) { f = f + " + " + num(b); }
  if (b < 0) { f = f + " − " + num(-b); }
  return f;
}

Start {
  ptX = X.t; ptNX = NX.t;
}

Update {
  // Противоположные точки: какая сдвинулась — вторая зеркалится относительно нуля
  // (направляющая симметрична, поэтому зеркальный параметр — 1 − t).
  if (abs(X.t - ptX) >= abs(NX.t - ptNX)) { NX.t = 1 - X.t; } else { X.t = 1 - NX.t; }
  ptX = X.t; ptNX = NX.t;

  // V сдвигает график (K едет вместе с ним), K меняет наклон k. Обе точки и M
  // остаются в поле: V не заходит туда, где K не поместилась бы, K и M при
  // необходимости сдвигаются по графику к ближайшему допустимому месту.
  if (abs(K.pos.x - pKx) + abs(K.pos.y - pKy) > abs(V.pos.x - pVx) + abs(V.pos.y - pVy)) {
    // Двигают K: новый наклон; K не ближе 0.5 к вершине по горизонтали, 0.2 ≤ |k| ≤ 6
    kdx = K.pos.x - ga;
    if (abs(kdx) < 0.5) { if (kdx < 0) { kdx = -0.5; } else { kdx = 0.5; } }
    gk = min(max((K.pos.y - gb) / abs(kdx), -6), 6);
    // Не вырождаемся в горизонтальную прямую: |k| ≥ 0.2 (знак — со стороны, куда тянут K)
    if (abs(gk) < 0.2) { if (K.pos.y < gb) { gk = -0.2; } else { gk = 0.2; } }
  } else {
    // Двигают V: вершина не выше/ниже, чем позволяет уместить K
    if (gk > 0) { V.pos.y = min(V.pos.y, fieldMaxY - 0.5 * gk); } else { V.pos.y = max(V.pos.y, -fieldMaxY - 0.5 * gk); }
    ga = V.pos.x; gb = V.pos.y;
  }
  // Сколько места по горизонтали от вершины до выхода графика за поле
  float half = 20;
  if (gk > 0) { half = (fieldMaxY - gb) / gk; }
  if (gk < 0) { half = (fieldMaxY + gb) / -gk; }
  float kx = min(max(kdx, -half), half);
  kx = min(max(ga + kx, -fieldMaxX), fieldMaxX);
  if (abs(kx - ga) < 0.5) { if (kx < fieldMaxX - 0.5) { kx = ga + 0.5; } else { kx = ga - 0.5; } }
  kdx = kx - ga;
  K.pos.x = kx; K.pos.y = fabs(kx);
  pVx = V.pos.x; pVy = V.pos.y; pKx = K.pos.x; pKy = K.pos.y;

  float mx = min(max(P.pos.x, ga - half), ga + half);
  mx = min(max(mx, -fieldMaxX), fieldMaxX);
  P.t = (mx - grAbs.xmin) / (grAbs.xmax - grAbs.xmin);
  P.pos.x = mx; P.pos.y = fabs(mx);

  // Проекции точки графика на оси
  Px.pos.x = P.pos.x; Px.pos.y = 0;
  Py.pos.x = 0; Py.pos.y = P.pos.y;

  if (tab == 1) {
    info = "**Модуль числа** — расстояние от нуля до соответствующей точки числовой прямой, поэтому он никогда не отрицателен.\n\n**Противоположные числа имеют равные модули:** |" + num(X.pos.x) + "| = |" + num(NX.pos.x) + "| = " + num(abs(X.pos.x)) + ".";
  } else if (tab == 2) {
    info = "**Модуль разности |a − b|** — расстояние между точками a и b на числовой прямой; порядок не важен: |a − b| = |b − a|.\n\n|a − b| = |" + num(Pa.pos.x) + " − " + numP(Pb.pos.x) + "| = " + num(abs(Pa.pos.x - Pb.pos.x)) + ".";
  } else {
    info = "**График y = |x|** — «галочка»: при x ≥ 0 он совпадает с прямой y = x, при x < 0 — с прямой y = −x. Сдвиг вершины в точку (a; b) и растяжение ветвей в k раз дают график y = k·|x − a| + b; при k < 0 «галочка» перевёрнута.\n\ny = " + graphFormula() + ";   M(" + num(P.pos.x) + "; " + num(P.pos.y) + ").";
  }
}
]
