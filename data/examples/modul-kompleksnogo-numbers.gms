[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true; show grid = true;

string info = "";

// ---- Точка z = a + bi, её проекция на действительную ось и сопряжённое z̄ ----
new Point { name = "O0"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("0") }
new Point { name = "Z"; pos = (3, 2); text = true("z"); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "X"; pos = (3, 0); dynamic = false; collision = false; collideWithPoints = false }
new Point { name = "Zc"; pos = (3, -2); dynamic = false; collision = false; collideWithPoints = false; text = true("z*"); color = #f59e0b }
new Line { name = "oz"; pos = (O0, Z); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "ox"; pos = (O0, X); interact = false }
new Line { name = "xz"; pos = (X, Z); interact = false }
new Line { name = "ozc"; pos = (O0, Zc); color = #f59e0b; thickness = 2; interact = false }
draw Punctir { name = "pxz"; edge = "xz" }

Function num(v, d) { if (v < -0.0000001) { return "−" + format(-v, d); } return format(abs(v), d); }
Function cx(a, b) { if (b < -0.0000001) { return num(a, 1) + " − " + format(-b, 1) + "i"; } return num(a, 1) + " + " + format(abs(b), 1) + "i"; }

Update {
  float a = Z.pos.x; float b = Z.pos.y;
  float r = sqrt(a * a + b * b);
  X.pos.x = a; X.pos.y = 0;
  Zc.pos.x = a; Zc.pos.y = -b;
  info = "**Модуль** числа z = a + bi — расстояние от точки z до начала координат: |z| = √(a² + b²) (теорема Пифагора для треугольника с катетами |a| и |b|).\n\nz = " + cx(a, b) + ", |z| = √(" + format(a * a, 2) + " + " + format(b * b, 2) + ") = **" + format(r, 2) + "**.\n\nСопряжённое z̄ (на поле — z*) = " + cx(a, -b) + ": z · z̄ = a² + b² = " + format(r * r, 2) + " = |z|², поэтому |z̄| = |z| = " + format(r, 2) + ". Если b = 0, модуль совпадает с обычным модулем действительного числа: |a| = " + format(abs(a), 2) + ".";
}
]
