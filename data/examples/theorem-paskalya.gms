[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Шестиугольник ABCDEF, вписанный в окружность (вершины ходят по окружности) ----
// Шестиугольник может быть и самопересекающимся — теорема верна для любого порядка вершин.
new Point { name = "O"; pos = (0, 0); dynamic = false; size = 0.6; collision = false }
new Circle { name = "w"; center = O; radius = 3.2 }
new Point { name = "A"; circle = "w"; t = 0.509; text = true("A"); pauseOnDrag = false }
new Point { name = "B"; circle = "w"; t = 0.078; text = true("B"); pauseOnDrag = false }
new Point { name = "C"; circle = "w"; t = 0.608; text = true("C"); pauseOnDrag = false }
new Point { name = "D"; circle = "w"; t = 0.825; text = true("D"); pauseOnDrag = false }
new Point { name = "E"; circle = "w"; t = 0.166; text = true("E"); pauseOnDrag = false }
new Point { name = "F"; circle = "w"; t = 0.33; text = true("F"); pauseOnDrag = false }

// Пары противоположных сторон одного цвета: AB и DE, BC и EF, CD и FA
new Line { name = "ab"; pos = (A, B); color = #f59e0b; thickness = 3 }
new Line { name = "de"; pos = (D, E); color = #f59e0b; thickness = 3 }
new Line { name = "bc"; pos = (B, C); color = #22c55e; thickness = 3 }
new Line { name = "ef"; pos = (E, F); color = #22c55e; thickness = 3 }
new Line { name = "cd"; pos = (C, D); color = #a855f7; thickness = 3 }
new Line { name = "fa"; pos = (F, A); color = #a855f7; thickness = 3 }
new Figure { name = "hex"; elements = (ab, bc, cd, de, ef, fa); interact = false }

// ---- Точки пересечения продолжений противоположных сторон и прямая Паскаля ----
new Point { name = "X"; pos = (0, 0); dynamic = false; collision = false; size = 0.8; text = true("X") }
new Point { name = "Y"; pos = (0, 0); dynamic = false; collision = false; size = 0.8; text = true("Y") }
new Point { name = "Z"; pos = (0, 0); dynamic = false; collision = false; size = 0.8; text = true("Z") }
new Line { name = "x1"; pos = (B, X); active = false }
new Line { name = "x2"; pos = (D, X); active = false }
new Line { name = "y1"; pos = (C, Y); active = false }
new Line { name = "y2"; pos = (E, Y); active = false }
new Line { name = "z1"; pos = (D, Z); active = false }
new Line { name = "z2"; pos = (F, Z); active = false }
draw Punctir { name = "px1"; edge = "x1"; color = #f59e0b; layer = 1 }
draw Punctir { name = "px2"; edge = "x2"; color = #f59e0b; layer = 1 }
draw Punctir { name = "py1"; edge = "y1"; color = #22c55e; layer = 1 }
draw Punctir { name = "py2"; edge = "y2"; color = #22c55e; layer = 1 }
draw Punctir { name = "pz1"; edge = "z1"; color = #a855f7; layer = 1 }
draw Punctir { name = "pz2"; edge = "z2"; color = #a855f7; layer = 1 }
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "pascal"; pos = (L1, L2); color = #3b82f6; thickness = 3; interact = false; layer = 2 }

// ---- Логика ----
string info = "";
float ix = 0; float iy = 0;

// Пересечение прямых PQ и RS → (ix, iy); почти параллельные — точка далеко в нужную сторону
Function meet(px, py, qx, qy, rx, ry, sx, sy) {
  float d1x = qx - px; float d1y = qy - py; float d2x = sx - rx; float d2y = sy - ry;
  float den = d1x * d2y - d1y * d2x;
  if (abs(den) < 0.000001) { den = 0.000001; }
  float k = ((rx - px) * d2y - (ry - py) * d2x) / den;
  ix = px + k * d1x; iy = py + k * d1y;
  return 0;
}
Function inView(P) { return abs(P.pos.x) <= fieldMaxX && abs(P.pos.y) <= fieldMaxY; }

Update {
  meet(A.pos.x, A.pos.y, B.pos.x, B.pos.y, D.pos.x, D.pos.y, E.pos.x, E.pos.y); X.pos.x = ix; X.pos.y = iy;
  meet(B.pos.x, B.pos.y, C.pos.x, C.pos.y, E.pos.x, E.pos.y, F.pos.x, F.pos.y); Y.pos.x = ix; Y.pos.y = iy;
  meet(C.pos.x, C.pos.y, D.pos.x, D.pos.y, F.pos.x, F.pos.y, A.pos.x, A.pos.y); Z.pos.x = ix; Z.pos.y = iy;

  // Прямая Паскаля — через две самые удалённые друг от друга точки, на всю ширину поля
  float dx = X.pos.x - Z.pos.x; float dy = X.pos.y - Z.pos.y;
  float bx = Z.pos.x; float by = Z.pos.y;
  if (dx * dx + dy * dy < (Y.pos.x - Z.pos.x) ^ 2 + (Y.pos.y - Z.pos.y) ^ 2) { dx = Y.pos.x - Z.pos.x; dy = Y.pos.y - Z.pos.y; }
  float l = sqrt(dx * dx + dy * dy) + 0.000001; dx = dx / l; dy = dy / l;
  // ближайшая к центру поля точка прямой и отрезок ±30 от неё
  float t0 = -(bx * dx + by * dy);
  L1.pos.x = bx + dx * (t0 - 30); L1.pos.y = by + dy * (t0 - 30);
  L2.pos.x = bx + dx * (t0 + 30); L2.pos.y = by + dy * (t0 + 30);

  float nOut = 0;
  if (!inView(X)) { nOut = nOut + 1; } if (!inView(Y)) { nOut = nOut + 1; } if (!inView(Z)) { nOut = nOut + 1; }
  info = "**Теорема Паскаля:** у шестиугольника, вписанного в окружность, три точки пересечения прямых, содержащих противоположные стороны (AB и DE, BC и EF, CD и FA), лежат на одной прямой — прямой Паскаля.";
  if (nOut > 0) { info = info + "\n\nСейчас " + format(nOut, 0) + " из точек X, Y, Z за пределами поля — прямая Паскаля всё равно проходит через них: пунктиры сторон сходятся на ней."; }
}
]
