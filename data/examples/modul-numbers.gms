[
description = "{info}"

field width = 20;
field height = 10;
show boundary = true;
show axis x = true;

// ---- Числовая прямая: невидимая направляющая, по которой ходят точки ----
new Point { name = "L1"; pos = (-9.5, 0); dynamic = false; active = false }
new Point { name = "L2"; pos = (9.5, 0); dynamic = false; active = false }
new Line { name = "axisLine"; pos = (L1, L2); active = false; interact = false }

new Point { name = "O"; pos = (0, 0); dynamic = false; size = 0.6; collision = false }

// ---- Вкладка 1: модуль — расстояние до нуля; |x| = |−x| ----
// X и NX — пара противоположных чисел. Обе точки перетаскиваются, вторая
// зеркалится относительно нуля в Update.
new Point { name = "X"; line = "axisLine"; t = 0.6789; text = true("x"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "NX"; line = "axisLine"; t = 0.3211; text = true("−x"); pauseOnDrag = false; collideWithPoints = false }
new Line { name = "ox"; pos = (O, X); color = #3b82f6; thickness = 4; interact = false; layer = 12 }
new Line { name = "onx"; pos = (O, NX); color = #3b82f6; thickness = 4; interact = false; layer = 12 }
draw EquallySing { name = "eqOx"; edges = (ox, onx); type = 1 }
draw Text { name = "lblX"; pos = (X.pos.x / 2, 0.8); text = "|x|" }
draw Text { name = "lblNX"; pos = (NX.pos.x / 2, 0.8); text = "|−x|" }

new Claster { name = "tabAbs"; elements = (X, NX, ox, onx, eqOx, lblX, lblNX); active = true }

// ---- Вкладка 2: |a − b| — расстояние между точками ----
new Point { name = "Pa"; line = "axisLine"; t = 0.3421; text = true("a"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Pb"; line = "axisLine"; t = 0.7632; text = true("b"); pauseOnDrag = false; collideWithPoints = false }
new Line { name = "ab"; pos = (Pa, Pb); color = #f59e0b; thickness = 4; interact = false; layer = 12 }
draw Text { name = "lblAB"; pos = ((Pa.pos.x + Pb.pos.x) / 2, 0.8); text = "|a − b|" }

new Claster { name = "tabDist"; elements = (Pa, Pb, ab, lblAB); active = false }

// ---- Вкладка 3: график y = |x| ----
func fabs(x) = abs(x);
draw Function { name = "grAbs"; f = "fabs"; xmin = -9.5; xmax = 9.5; segments = 400; grid = true; color = #3b82f6; thickness = 3 }
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

new Claster { name = "tabGraph"; elements = (grAbs, P, Px, Py, prX, prY, yAxis); active = false }

// ---- Кнопки вкладок ----
new UI { name = "btnAbs"; type = button; label = "Модуль числа"; action = "tab = 1; tabAbs.active = true; tabDist.active = false; tabGraph.active = false" }
new UI { name = "btnDist"; type = button; label = "Расстояние |a − b|"; action = "tab = 2; tabAbs.active = false; tabDist.active = true; tabGraph.active = false" }
new UI { name = "btnGraph"; type = button; label = "График y = |x|"; action = "tab = 3; tabAbs.active = false; tabDist.active = false; tabGraph.active = true" }

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

Start {
  ptX = X.t; ptNX = NX.t;
}

Update {
  // Противоположные точки: какая сдвинулась — вторая зеркалится относительно нуля
  // (направляющая симметрична, поэтому зеркальный параметр — 1 − t).
  if (abs(X.t - ptX) >= abs(NX.t - ptNX)) { NX.t = 1 - X.t; } else { X.t = 1 - NX.t; }
  ptX = X.t; ptNX = NX.t;

  // Проекции точки графика на оси
  Px.pos.x = P.pos.x; Px.pos.y = 0;
  Py.pos.x = 0; Py.pos.y = P.pos.y;

  if (tab == 1) {
    info = "**Модуль числа** — расстояние от нуля до соответствующей точки числовой прямой, поэтому он никогда не отрицателен.\n\nx = " + num(X.pos.x) + ", |x| = " + num(abs(X.pos.x)) + ".\n\n**Противоположные числа имеют равные модули:** |" + num(X.pos.x) + "| = |" + num(NX.pos.x) + "| = " + num(abs(X.pos.x)) + ".";
  } else if (tab == 2) {
    info = "**Модуль разности |a − b|** — расстояние между точками a и b на числовой прямой; порядок не важен: |a − b| = |b − a|.\n\n|a − b| = |" + num(Pa.pos.x) + " − " + numP(Pb.pos.x) + "| = " + num(abs(Pa.pos.x - Pb.pos.x)) + ".";
  } else {
    info = "**График y = |x|** — «галочка»: при x ≥ 0 он совпадает с прямой y = x, при x < 0 — с прямой y = −x.\n\nM(" + num(P.pos.x) + "; " + num(P.pos.y) + "): |" + num(P.pos.x) + "| = " + num(P.pos.y) + ".";
  }
}
]
