[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 60);
camera start zoom = 1.35;

// ---- Скрещивающиеся прямые a = AB и b = CD (все четыре точки свободны). PQ — общий
// перпендикуляр (P ∈ a, Q ∈ b). Плоскости α ⊃ a, α ∥ b и β ⊃ b, β ∥ a параллельны,
// расстояние между ними равно PQ. Точка X ∈ a (ползунок) уходит от P. ----
new Point3D { name = "A"; pos = (-3, -1.5, -2); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (3, -0.5, -1.5); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (-1.5, 2, 3); text = true("C"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "D"; pos = (1.5, 1.5, -3); text = true("D"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "P"; pos = (0, 0, 0); text = true("P"); color = #22c55e; dynamic = false; collision = false }
new Point3D { name = "Q"; pos = (0, 0, 0); text = true("Q"); color = #22c55e; dynamic = false; collision = false }
new Point3D { name = "X"; pos = (0, 0, 0); text = true("X"); color = #3b82f6; dynamic = false; collision = false }
new Point3D { name = "E"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "F"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "L1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "L2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "N1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "N2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "la"; pos = (L1, L2); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "lb"; pos = (N1, N2); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "pq"; pos = (P, Q); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "xq"; pos = (X, Q); interact = false; thickness = 2 }
draw Punctir { name = "punXq"; edge = "xq" }
draw InfPlane { name = "alpha"; points = (A, B, E); size = 2.8; opacity = 0.14; color = #3b82f6 }
draw InfPlane { name = "beta"; points = (C, D, F); size = 2.8; opacity = 0.14; color = #f59e0b }

new UI { name = "sS"; type = slider; label = "положение X на прямой a: PX"; variable = s; min = -4; max = 4; step = 0.05; default = 2 }

string info = "";
float s = 2;
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;
float pdx = 0; float pdy = 0; float pdz = 0;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function tb(m, d, h) {
  if (d > 0.000001) { return (h - m) / d; }
  if (d < -0.000001) { return (-h - m) / d; }
  return 1000;
}
Function inF(x, y, z) { return abs(x) <= 4.3 && abs(y) <= 4.3 && abs(z) <= 4.3; }
// Расстояние от точки (px, py, pz) до прямой через (qx, qy, qz) с направлением (dx, dy, dz).
Function dl(px, py, pz, qx, qy, qz, dx, dy, dz) {
  float rx = px - qx; float ry = py - qy; float rz = pz - qz;
  float cx = ry * dz - rz * dy; float cy = rz * dx - rx * dz; float cz = rx * dy - ry * dx;
  return sqrt(cx * cx + cy * cy + cz * cz) / sqrt(dx * dx + dy * dy + dz * dz);
}
// Параметры концов общего перпендикуляра: P = A + k·AB, Q = C + m·CD; k при ind = 0, m при ind = 1.
Function foot(ind) {
  float d1x = B.pos.x - A.pos.x; float d1y = B.pos.y - A.pos.y; float d1z = B.pos.z - A.pos.z;
  float d2x = D.pos.x - C.pos.x; float d2y = D.pos.y - C.pos.y; float d2z = D.pos.z - C.pos.z;
  float wx = A.pos.x - C.pos.x; float wy = A.pos.y - C.pos.y; float wz = A.pos.z - C.pos.z;
  float a = d1x * d1x + d1y * d1y + d1z * d1z; float b = d1x * d2x + d1y * d2y + d1z * d2z;
  float c = d2x * d2x + d2y * d2y + d2z * d2z;
  float e1 = d1x * wx + d1y * wy + d1z * wz; float e2 = d2x * wx + d2y * wy + d2z * wz;
  float den = a * c - b * b;
  if (ind < 0.5) { return (b * e2 - c * e1) / den; }
  return (a * e2 - b * e1) / den;
}
// Допустимо: прямые скрещиваются (не параллельны и не пересекаются), концы перпендикуляра в поле.
Function ok() {
  if (!inF(A.pos.x, A.pos.y, A.pos.z) || !inF(B.pos.x, B.pos.y, B.pos.z) || !inF(C.pos.x, C.pos.y, C.pos.z) || !inF(D.pos.x, D.pos.y, D.pos.z)) { return false; }
  float d1x = B.pos.x - A.pos.x; float d1y = B.pos.y - A.pos.y; float d1z = B.pos.z - A.pos.z;
  float d2x = D.pos.x - C.pos.x; float d2y = D.pos.y - C.pos.y; float d2z = D.pos.z - C.pos.z;
  float l1 = sqrt(d1x * d1x + d1y * d1y + d1z * d1z); float l2 = sqrt(d2x * d2x + d2y * d2y + d2z * d2z);
  if (l1 < 1.6 || l2 < 1.6) { return false; }
  float nx = d1y * d2z - d1z * d2y; float ny = d1z * d2x - d1x * d2z; float nz = d1x * d2y - d1y * d2x;
  float nl = sqrt(nx * nx + ny * ny + nz * nz);
  if (nl < 0.25 * l1 * l2) { return false; }
  float mixed = (C.pos.x - A.pos.x) * nx + (C.pos.y - A.pos.y) * ny + (C.pos.z - A.pos.z) * nz;
  if (abs(mixed) / nl < 0.6) { return false; }
  float k = foot(0); float m = foot(1);
  return inF(A.pos.x + k * d1x, A.pos.y + k * d1y, A.pos.z + k * d1z) && inF(C.pos.x + m * d2x, C.pos.y + m * d2y, C.pos.z + m * d2z);
}

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; pdx = D.pos.x; pdy = D.pos.y; pdz = D.pos.z;
}

Update {
  if (ok()) {
    pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
    pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; pdx = D.pos.x; pdy = D.pos.y; pdz = D.pos.z;
  } else {
    A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz;
    C.pos.x = pcx; C.pos.y = pcy; C.pos.z = pcz; D.pos.x = pdx; D.pos.y = pdy; D.pos.z = pdz;
  }
  float d1x = B.pos.x - A.pos.x; float d1y = B.pos.y - A.pos.y; float d1z = B.pos.z - A.pos.z;
  float d2x = D.pos.x - C.pos.x; float d2y = D.pos.y - C.pos.y; float d2z = D.pos.z - C.pos.z;
  float l1 = sqrt(d1x * d1x + d1y * d1y + d1z * d1z); float l2 = sqrt(d2x * d2x + d2y * d2y + d2z * d2z);
  float u1x = d1x / l1; float u1y = d1y / l1; float u1z = d1z / l1;
  float nx = d1y * d2z - d1z * d2y; float ny = d1z * d2x - d1x * d2z; float nz = d1x * d2y - d1y * d2x;
  float nl = sqrt(nx * nx + ny * ny + nz * nz);
  float rx = C.pos.x - A.pos.x; float ry = C.pos.y - A.pos.y; float rz = C.pos.z - A.pos.z;
  float mixed = rx * nx + ry * ny + rz * nz;
  float k = foot(0); float m = foot(1);
  P.pos.x = A.pos.x + k * d1x; P.pos.y = A.pos.y + k * d1y; P.pos.z = A.pos.z + k * d1z;
  Q.pos.x = C.pos.x + m * d2x; Q.pos.y = C.pos.y + m * d2y; Q.pos.z = C.pos.z + m * d2z;
  E.pos.x = A.pos.x + d2x; E.pos.y = A.pos.y + d2y; E.pos.z = A.pos.z + d2z;
  F.pos.x = C.pos.x + d1x; F.pos.y = C.pos.y + d1y; F.pos.z = C.pos.z + d1z;
  float pqx = Q.pos.x - P.pos.x; float pqy = Q.pos.y - P.pos.y; float pqz = Q.pos.z - P.pos.z;
  float pq = sqrt(pqx * pqx + pqy * pqy + pqz * pqz);
  float a1 = min(tb(A.pos.x, -u1x, 4.3), tb(A.pos.y, -u1y, 4.3), tb(A.pos.z, -u1z, 4.3));
  float a2 = min(tb(A.pos.x, u1x, 4.3), tb(A.pos.y, u1y, 4.3), tb(A.pos.z, u1z, 4.3));
  L1.pos.x = A.pos.x - u1x * a1; L1.pos.y = A.pos.y - u1y * a1; L1.pos.z = A.pos.z - u1z * a1;
  L2.pos.x = A.pos.x + u1x * a2; L2.pos.y = A.pos.y + u1y * a2; L2.pos.z = A.pos.z + u1z * a2;
  float u2x = d2x / l2; float u2y = d2y / l2; float u2z = d2z / l2;
  float c1 = min(tb(C.pos.x, -u2x, 4.3), tb(C.pos.y, -u2y, 4.3), tb(C.pos.z, -u2z, 4.3));
  float c2 = min(tb(C.pos.x, u2x, 4.3), tb(C.pos.y, u2y, 4.3), tb(C.pos.z, u2z, 4.3));
  N1.pos.x = C.pos.x - u2x * c1; N1.pos.y = C.pos.y - u2y * c1; N1.pos.z = C.pos.z - u2z * c1;
  N2.pos.x = C.pos.x + u2x * c2; N2.pos.y = C.pos.y + u2y * c2; N2.pos.z = C.pos.z + u2z * c2;
  float p1 = min(tb(P.pos.x, -u1x, 4.3), tb(P.pos.y, -u1y, 4.3), tb(P.pos.z, -u1z, 4.3));
  float p2 = min(tb(P.pos.x, u1x, 4.3), tb(P.pos.y, u1y, 4.3), tb(P.pos.z, u1z, 4.3));
  float se = max(-p1, min(p2, s));
  X.pos.x = P.pos.x + se * u1x; X.pos.y = P.pos.y + se * u1y; X.pos.z = P.pos.z + se * u1z;
  float dxb = dl(X.pos.x, X.pos.y, X.pos.z, C.pos.x, C.pos.y, C.pos.z, d2x, d2y, d2z);

  info = "**Расстояние между скрещивающимися прямыми a = AB и b = CD** — длина их единственного общего перпендикуляра PQ (P ∈ a, Q ∈ b). Через каждую прямую проходит плоскость, параллельная другой: α ⊃ a (синяя) и β ⊃ b (жёлтая); эти плоскости параллельны, и расстояние между ними равно PQ.\n\n";
  info = info + "AC = (" + num(rx, 1) + "; " + num(ry, 1) + "; " + num(rz, 1) + "), AB × CD = (" + num(nx, 1) + "; " + num(ny, 1) + "; " + num(nz, 1) + "): d = |(AC, AB, CD)| / |AB × CD| = " + num(abs(mixed), 2) + " / " + num(nl, 2) + " = **" + num(abs(mixed) / nl, 2) + "**. Длина построенного перпендикуляра PQ = " + num(pq, 2) + ".\n\n";
  info = info + "**Наименьшее расстояние.** Точка X ∈ a при PX = " + num(abs(se), 2) + ": расстояние от X до плоскости β равно " + num(pq, 2) + " при любом X, а до прямой b — " + num(dxb, 2) + (abs(se) < 0.05 ? " (X = P, минимум достигнут)." : " > " + num(pq, 2) + ".");
}
]
