[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Центр перспективы O и треугольник ABC (перетаскиваются) ----
new Point { name = "O"; pos = (-5.5, 2.82); text = true("O"); pauseOnDrag = false }
new Point { name = "A"; pos = (-2.07, 1.15); text = true("A"); pauseOnDrag = false; color = #f59e0b }
new Point { name = "B"; pos = (-4.19, 1.61); text = true("B"); pauseOnDrag = false; color = #f59e0b }
new Point { name = "C"; pos = (-4.16, 0.41); text = true("C"); pauseOnDrag = false; color = #f59e0b }
new Line { name = "oa"; pos = (O, A); active = false }
new Line { name = "ob"; pos = (O, B); active = false }
new Line { name = "oc"; pos = (O, C); active = false }
// ---- Треугольник A'B'C': вершины ездят по прямым OA, OB, OC ----
new Point { name = "A2"; line = "oa"; extend = true; t = 1.61; text = true("A′"); pauseOnDrag = false; color = #22c55e }
new Point { name = "B2"; line = "ob"; extend = true; t = 2.74; text = true("B′"); pauseOnDrag = false; color = #22c55e }
new Point { name = "C2"; line = "oc"; extend = true; t = 1.93; text = true("C′"); pauseOnDrag = false; color = #22c55e }

// Лучи из O — пунктиром до дальней вершины
new Point { name = "RA"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "RB"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "RC"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "ra"; pos = (O, RA); active = false }
new Line { name = "rb"; pos = (O, RB); active = false }
new Line { name = "rc"; pos = (O, RC); active = false }
draw Punctir { name = "pra"; edge = "ra"; layer = 1 }
draw Punctir { name = "prb"; edge = "rb"; layer = 1 }
draw Punctir { name = "prc"; edge = "rc"; layer = 1 }

new Line { name = "ab"; pos = (A, B); color = #f59e0b; thickness = 3 }
new Line { name = "bc"; pos = (B, C); color = #f59e0b; thickness = 3 }
new Line { name = "ca"; pos = (C, A); color = #f59e0b; thickness = 3 }
new Line { name = "ab2"; pos = (A2, B2); color = #22c55e; thickness = 3 }
new Line { name = "bc2"; pos = (B2, C2); color = #22c55e; thickness = 3 }
new Line { name = "ca2"; pos = (C2, A2); color = #22c55e; thickness = 3 }
new Figure { name = "t1"; elements = (ab, bc, ca) }
new Figure { name = "t2"; elements = (ab2, bc2, ca2); interact = false }

// ---- Точки пересечения соответственных сторон и ось Дезарга ----
new Point { name = "X"; pos = (0, 0); dynamic = false; collision = false; size = 0.8; text = true("X") }
new Point { name = "Y"; pos = (0, 0); dynamic = false; collision = false; size = 0.8; text = true("Y") }
new Point { name = "Z"; pos = (0, 0); dynamic = false; collision = false; size = 0.8; text = true("Z") }
new Line { name = "x1"; pos = (B, X); active = false }
new Line { name = "x2"; pos = (B2, X); active = false }
new Line { name = "y1"; pos = (C, Y); active = false }
new Line { name = "y2"; pos = (C2, Y); active = false }
new Line { name = "z1"; pos = (A, Z); active = false }
new Line { name = "z2"; pos = (A2, Z); active = false }
draw Punctir { name = "px1"; edge = "x1"; layer = 1 }
draw Punctir { name = "px2"; edge = "x2"; layer = 1 }
draw Punctir { name = "py1"; edge = "y1"; layer = 1 }
draw Punctir { name = "py2"; edge = "y2"; layer = 1 }
draw Punctir { name = "pz1"; edge = "z1"; layer = 1 }
draw Punctir { name = "pz2"; edge = "z2"; layer = 1 }
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "axis"; pos = (L1, L2); color = #3b82f6; thickness = 3; interact = false; layer = 2 }

// ---- Логика ----
string info = "";
float ix = 0; float iy = 0;

Function meet(px, py, qx, qy, rx, ry, sx, sy) {
  float d1x = qx - px; float d1y = qy - py; float d2x = sx - rx; float d2y = sy - ry;
  float den = d1x * d2y - d1y * d2x;
  if (abs(den) < 0.000001) { den = 0.000001; }
  float k = ((rx - px) * d2y - (ry - py) * d2x) / den;
  ix = px + k * d1x; iy = py + k * d1y;
  return 0;
}
// Конец луча из O через P и P': дальняя из двух точек, с запасом 0.8
Function rayEnd(P, Q, R) {
  float d1 = sqrt((P.pos.x - O.pos.x) ^ 2 + (P.pos.y - O.pos.y) ^ 2);
  float d2 = sqrt((Q.pos.x - O.pos.x) ^ 2 + (Q.pos.y - O.pos.y) ^ 2);
  float m = max(d1, d2) + 0.8; float l = max(d1, 0.001);
  R.pos.x = O.pos.x + (P.pos.x - O.pos.x) / l * m; R.pos.y = O.pos.y + (P.pos.y - O.pos.y) / l * m;
  return 0;
}

Update {
  rayEnd(A, A2, RA); rayEnd(B, B2, RB); rayEnd(C, C2, RC);
  meet(A.pos.x, A.pos.y, B.pos.x, B.pos.y, A2.pos.x, A2.pos.y, B2.pos.x, B2.pos.y); X.pos.x = ix; X.pos.y = iy;
  meet(B.pos.x, B.pos.y, C.pos.x, C.pos.y, B2.pos.x, B2.pos.y, C2.pos.x, C2.pos.y); Y.pos.x = ix; Y.pos.y = iy;
  meet(C.pos.x, C.pos.y, A.pos.x, A.pos.y, C2.pos.x, C2.pos.y, A2.pos.x, A2.pos.y); Z.pos.x = ix; Z.pos.y = iy;
  float dx = X.pos.x - Z.pos.x; float dy = X.pos.y - Z.pos.y;
  if (dx * dx + dy * dy < (Y.pos.x - Z.pos.x) ^ 2 + (Y.pos.y - Z.pos.y) ^ 2) { dx = Y.pos.x - Z.pos.x; dy = Y.pos.y - Z.pos.y; }
  float l = sqrt(dx * dx + dy * dy) + 0.000001; dx = dx / l; dy = dy / l;
  float t0 = -(Z.pos.x * dx + Z.pos.y * dy);
  L1.pos.x = Z.pos.x + dx * (t0 - 30); L1.pos.y = Z.pos.y + dy * (t0 - 30);
  L2.pos.x = Z.pos.x + dx * (t0 + 30); L2.pos.y = Z.pos.y + dy * (t0 + 30);

  info = "**Теорема Дезарга:** если прямые AA′, BB′, CC′, соединяющие соответственные вершины двух треугольников, пересекаются в одной точке O (треугольники перспективны относительно центра), то точки пересечения соответственных сторон — X = AB ∩ A′B′, Y = BC ∩ B′C′, Z = CA ∩ C′A′ — лежат на одной прямой (оси перспективы).\n\nДвигайте O, вершины ABC и вершины A′B′C′ вдоль их прямых.";
}
]
