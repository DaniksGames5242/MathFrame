[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Четырёхугольник ABCD со свободными вершинами: любые их положения дают фигуру —
// от выпуклой до самопересекающейся. Диагональ AC делит её на два треугольника —
// иллюстрация аддитивности площади. Живая проверка выпуклости — по знакам поворотов
// на всех четырёх вершинах. ----
new Point { name = "A"; pos = (-6, -3); text = true("A") }
new Point { name = "B"; pos = (5, -3.5); text = true("B") }
new Point { name = "C"; pos = (6, 3.5); text = true("C") }
new Point { name = "D"; pos = (-4, 2.5); text = true("D") }

new Line { name = "ab"; pos = (A, B); interact = false }
new Line { name = "bc"; pos = (B, C); interact = false }
new Line { name = "cd"; pos = (C, D); interact = false }
new Line { name = "da"; pos = (D, A); interact = false }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }
new Line { name = "diag"; pos = (A, C); interact = false }

// ---- Логика ----
string info = "";

Function cross(ax, ay, bx, by, cx, cy) { return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax); }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float ax = A.pos.x; float ay = A.pos.y; float bx = B.pos.x; float by = B.pos.y;
  float cx = C.pos.x; float cy = C.pos.y; float dx = D.pos.x; float dy = D.pos.y;

  float t1 = abs(cross(ax, ay, bx, by, cx, cy)) / 2;
  float t2 = abs(cross(ax, ay, cx, cy, dx, dy)) / 2;
  float s = abs((ax * by - bx * ay) + (bx * cy - cx * by) + (cx * dy - dx * cy) + (dx * ay - ax * dy)) / 2;

  float s1 = cross(ax, ay, bx, by, cx, cy);
  float s2 = cross(bx, by, cx, cy, dx, dy);
  float s3 = cross(cx, cy, dx, dy, ax, ay);
  float s4 = cross(dx, dy, ax, ay, bx, by);
  float sameSign = 1;
  if (!((s1 > 0 && s2 > 0 && s3 > 0 && s4 > 0) || (s1 < 0 && s2 < 0 && s3 < 0 && s4 < 0))) { sameSign = 0; }

  string vid = "";
  if (sameSign == 1) { vid = "**выпуклая** — любой отрезок между двумя её точками целиком лежит внутри"; }
  else { vid = "**невыпуклая** (возможно, самопересекающаяся) — есть отрезок между точками фигуры, выходящий за границу"; }

  info = "**Фигура ABCD** — двумерная (ограничивает область ненулевой площади), " + vid + ".\n\n**Аддитивность площади:** диагональ AC делит четырёхугольник на треугольники ABC и ACD площадью " + num(t1, 2) + " и " + num(t2, 2) + "; их сумма " + num(t1 + t2, 2) + " равна площади всей фигуры " + num(s, 2) + " — площадь частей без общих внутренних точек складывается.";
}
]
