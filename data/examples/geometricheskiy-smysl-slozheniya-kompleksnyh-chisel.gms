[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true; show grid = true;

float tab = 1; float px1 = 2; float py1 = 1; float px2 = 1; float py2 = 2.5; string info = "";

new Point { name = "O0"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false }
new Point { name = "Z1"; pos = (2, 1); text = true("z₁"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "Z2"; pos = (1, 2.5); text = true("z₂"); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new Point { name = "S"; pos = (3, 3.5); dynamic = false; collision = false; collideWithPoints = false; text = true("z₁ + z₂"); color = #22c55e }
new Line { name = "o1"; pos = (O0, Z1); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "o2"; pos = (O0, Z2); color = #f59e0b; thickness = 3; interact = false }
new Line { name = "os"; pos = (O0, S); color = #22c55e; thickness = 3; interact = false }
draw Vector { name = "v1"; edge = "o1"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "v2"; edge = "o2"; pos = 1; color = #f59e0b; thickness = 3 }
draw Vector { name = "vs"; edge = "os"; pos = 1; color = #22c55e; thickness = 3 }

// ---- Вкладка 1: правило параллелограмма ----
new Line { name = "z1s"; pos = (Z1, S); interact = false }
new Line { name = "z2s"; pos = (Z2, S); interact = false }
draw Punctir { name = "p1"; edge = "z1s" }
draw Punctir { name = "p2"; edge = "z2s" }
new Claster { name = "tabPar"; elements = (z1s, z2s, p1, p2); active = true }

// ---- Вкладка 2: неравенство треугольника — z₂ откладывается от конца z₁ ----
new Line { name = "tr"; pos = (Z1, S); color = #f59e0b; thickness = 3; interact = false }
new Claster { name = "tabTri"; elements = (tr); active = false }

// ---- Вкладка 3: среднее арифметическое — середина отрезка z₁z₂ ----
new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("(z₁ + z₂)/2") }
new Line { name = "z12"; pos = (Z1, Z2); interact = false }
new Claster { name = "tabMid"; elements = (M, z12); active = false }

new UI { name = "b1"; type = button; label = "Параллелограмм"; action = "tab = 1; tabPar.active = true; tabTri.active = false; tabMid.active = false" }
new UI { name = "b2"; type = button; label = "Неравенство треугольника"; action = "tab = 2; tabPar.active = false; tabTri.active = true; tabMid.active = false" }
new UI { name = "b3"; type = button; label = "Среднее"; action = "tab = 3; tabPar.active = false; tabTri.active = false; tabMid.active = true" }

Function num(v, d) { if (v < -0.0000001) { return "−" + format(-v, d); } return format(abs(v), d); }
Function cx(a, b) { if (b < -0.0000001) { return num(a, 2) + " − " + format(-b, 2) + "i"; } return num(a, 2) + " + " + format(abs(b), 2) + "i"; }

Update {
  float x1 = Z1.pos.x; float y1 = Z1.pos.y; float x2 = Z2.pos.x; float y2 = Z2.pos.y;
  // сумма должна оставаться в поле: иначе координата хода откатывается
  if (abs(x1 + x2) > 7.4) { x1 = px1; x2 = px2; Z1.pos.x = x1; Z2.pos.x = x2; }
  if (abs(y1 + y2) > 4.4) { y1 = py1; y2 = py2; Z1.pos.y = y1; Z2.pos.y = y2; }
  px1 = x1; py1 = y1; px2 = x2; py2 = y2;
  float sx = x1 + x2; float sy = y1 + y2;
  S.pos.x = sx; S.pos.y = sy;
  M.pos.x = sx / 2; M.pos.y = sy / 2;
  float m1 = hypot(x1, y1); float m2 = hypot(x2, y2); float ms = hypot(sx, sy);
  if (tab == 1) {
    info = "**Сложение — сложение векторов.** Числа z₁ = " + cx(x1, y1) + " и z₂ = " + cx(x2, y2) + " — радиус-векторы из нуля. Складываются координаты: Re(z₁ + z₂) = " + num(x1, 2) + " + (" + num(x2, 2) + ") = " + num(sx, 2) + ", Im(z₁ + z₂) = " + num(y1, 2) + " + (" + num(y2, 2) + ") = " + num(sy, 2) + ".\n\nz₁ + z₂ = " + cx(sx, sy) + " — четвёртая вершина параллелограмма, построенного на z₁ и z₂ (правило параллелограмма); сумма — его диагональ из нуля.";
  }
  if (tab == 2) {
    string res = "Строгое неравенство: векторы не сонаправлены.";
    if (ms > m1 + m2 - 0.03) { res = "**Равенство**: векторы коллинеарны и сонаправлены."; }
    info = "**Неравенство треугольника.** Вектор z₂, отложенный от конца z₁, замыкает треугольник с вершинами 0, z₁, z₁ + z₂.\n\n|z₁ + z₂| = " + format(ms, 3) + " ≤ |z₁| + |z₂| = " + format(m1, 3) + " + " + format(m2, 3) + " = " + format(m1 + m2, 3) + ".\n\n" + res;
  }
  if (tab == 3) {
    info = "**Среднее арифметическое.** (z₁ + z₂)/2 = " + cx(sx / 2, sy / 2) + " — середина отрезка, соединяющего точки z₁ и z₂.\n\nz₁ = " + cx(x1, y1) + ", z₂ = " + cx(x2, y2) + ".";
  }
}
]
