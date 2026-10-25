[
description = "{info}"

field width = 20;
field height = 7;
camera type = fixed;
show axis x = true;

// ---- Координатная прямая: невидимая направляющая, по которой ходят точки ----
new Point { name = "L1"; pos = (-9.5, 0); dynamic = false; active = false }
new Point { name = "L2"; pos = (9.5, 0); dynamic = false; active = false }
new Line { name = "axisLine"; pos = (L1, L2); active = false; interact = false }

// Начальная точка O (нуль). Единица длины — одно деление оси.
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("O") }

// Две перетаскиваемые точки с координатами a и b (общие для всех вкладок)
new Point { name = "A"; line = "axisLine"; t = 0.2895; text = true("A"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "B"; line = "axisLine"; t = 0.8; text = true("B"); pauseOnDrag = false; collideWithPoints = false }

// ---- Вкладка 1: порядок и симметрия относительно начала ----
// A′ — точка, противоположная A: стоит на том же расстоянии от O по другую сторону.
new Point { name = "A2"; pos = (4, 0); dynamic = false; collision = false; text = true("A′") }
new Line { name = "oa"; pos = (O, A); color = #3b82f6; thickness = 4; interact = false; layer = 12 }
new Line { name = "oa2"; pos = (O, A2); color = #3b82f6; thickness = 4; interact = false; layer = 12 }
draw EquallySing { name = "eqA"; edges = (oa, oa2); type = 1 }
new Claster { name = "tabOrder"; elements = (A2, oa, oa2, eqA); active = true }

// ---- Вкладка 2: расстояние и середина отрезка ----
new Line { name = "ab"; pos = (A, B); color = #f59e0b; thickness = 4; interact = false; layer = 12 }
new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; text = true("M"); color = #22c55e }
new Claster { name = "tabDist"; elements = (ab, M); active = false }

// ---- Вкладка 3: сдвиг точки A на d единиц ----
new Point { name = "R"; pos = (0, 0); dynamic = false; collision = false; text = true("A + d"); color = #22c55e }
new Line { name = "shift"; pos = (A, R); color = #22c55e; thickness = 4; interact = false; layer = 12 }
draw Vector { name = "shiftV"; edge = "shift" }
new Claster { name = "tabShift"; elements = (R, shift, shiftV); active = false }

new UI { name = "btnOrder"; type = button; label = "Порядок и симметрия"; action = "tab = 1; tabOrder.active = true; tabDist.active = false; tabShift.active = false" }
new UI { name = "btnDist"; type = button; label = "Расстояние и середина"; action = "tab = 2; tabOrder.active = false; tabDist.active = true; tabShift.active = false" }
new UI { name = "btnShift"; type = button; label = "Сдвиг точки"; action = "tab = 3; tabOrder.active = false; tabDist.active = false; tabShift.active = true" }

// Сдвиг d: ползунок всегда оставляет результат A + d внутри поля
float tab = 1;
float d = 3;
float dLo = -9; float dHi = 9;
new UI { name = "sD"; type = slider; label = "сдвиг d"; variable = d; min = dLo; max = dHi; step = 0.1; default = 3; active = tab == 3 }

string info = "";

// Число с одним знаком после запятой и настоящим знаком минус; numP — отрицательное в скобках
Function num(v) {
  float r = round(v * 10) / 10;
  if (r < 0) { return "−" + format(abs(r), 1); }
  return format(abs(r), 1);
}
Function numP(v) {
  if (round(v * 10) / 10 < 0) { return "(" + num(v) + ")"; }
  return num(v);
}

Update {
  float a = A.pos.x;
  float b = B.pos.x;
  A2.pos.x = -a;
  M.pos.x = (a + b) / 2;
  // Границы сдвига зависят от положения A: результат a + d остаётся на оси
  dLo = -9.5 - a; dHi = 9.5 - a;
  if (d < dLo) { d = dLo; }
  if (d > dHi) { d = dHi; }
  R.pos.x = a + d;

  if (tab == 1) {
    string ord = "A левее B, значит a < b";
    if (a > b) { ord = "A правее B, значит a > b"; }
    if (a == b) { ord = "точки совпали, a = b"; }
    info = "**Координата точки** — число, равное расстоянию от O до точки со знаком: справа от O — плюс, слева — минус. Здесь a = " + num(a) + ", b = " + num(b) + ".\n\n**Порядок:** из двух чисел больше то, чья точка правее — " + ord + ".\n\n**Противоположные числа** лежат симметрично относительно O: точка A′ имеет координату −a = " + num(-a) + ".";
  } else if (tab == 2) {
    info = "**Расстояние между точками** — длина отрезка AB, поэтому знак не важен: |b − a| = |" + num(b) + " − " + numP(a) + "| = " + num(abs(b - a)) + ".\n\n**Середина отрезка** имеет координату (a + b)/2 = (" + num(a) + " + " + numP(b) + ") / 2 = " + num((a + b) / 2) + ".";
  } else {
    info = "**Сдвиг точки** на d единиц: при d > 0 координата растёт, при d < 0 — уменьшается. Новая координата a + d = " + num(a) + " + " + numP(d) + " = " + num(a + d) + ".\n\nТак на прямой выглядит сложение: к числу a прибавляют d, перемещаясь вдоль оси на |d| единиц вправо или влево.";
  }
}
]
