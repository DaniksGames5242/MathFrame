[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 60);
camera start zoom = 1.1;

// ---- Прямая a = AB. Точки M и N свободны: b — прямая через M, c — прямая через N,
// обе параллельны a (направление берётся у AB). Отсюда b ∥ c (транзитивность). ----
new Point3D { name = "A"; pos = (-3, -1, -2); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (3, 1, -2); text = true("B"); pauseOnDrag = false }
new Point3D { name = "M"; pos = (-1, 2, 1); text = true("M"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "N"; pos = (1, -2.5, 2); text = true("N"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "M1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "M2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "N1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "N2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 3 }
new Line3D { name = "bl"; pos = (M1, M2); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "cl"; pos = (N1, N2); interact = false; thickness = 3; color = #f59e0b }
draw InfPlane { name = "pl1"; points = (A, B, M); size = 3; opacity = 0.16; color = #3b82f6 }
draw InfPlane { name = "pl2"; points = (M, M2, N); size = 3; opacity = 0.16; color = #f59e0b }

string info = "";
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pmx = 0; float pmy = 0; float pmz = 0;
float pnx = 0; float pny = 0; float pnz = 0;

// Расстояние вдоль луча (m + t·d, t ≥ 0) до границы поля |координата| ≤ h.
Function tb(m, d, h) {
  if (d > 0.000001) { return (h - m) / d; }
  if (d < -0.000001) { return (-h - m) / d; }
  return 1000;
}
Function cl4(v) { if (v > 4.3) { return 4.3; } if (v < -4.3) { return -4.3; } return v; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
// Расстояние от точки P до прямой через Q с направлением (dx, dy, dz).
Function dl(px, py, pz, qx, qy, qz, dx, dy, dz) {
  float rx = px - qx; float ry = py - qy; float rz = pz - qz;
  float cx = ry * dz - rz * dy; float cy = rz * dx - rx * dz; float cz = rx * dy - ry * dx;
  return sqrt(cx * cx + cy * cy + cz * cz) / sqrt(dx * dx + dy * dy + dz * dz);
}
// Конфигурация допустима, если A ≠ B, а прямые a, b, c попарно различны.
Function ok() {
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; float dz = B.pos.z - A.pos.z;
  if (sqrt(dx * dx + dy * dy + dz * dz) < 1.6) { return false; }
  if (dl(M.pos.x, M.pos.y, M.pos.z, A.pos.x, A.pos.y, A.pos.z, dx, dy, dz) < 0.9) { return false; }
  if (dl(N.pos.x, N.pos.y, N.pos.z, A.pos.x, A.pos.y, A.pos.z, dx, dy, dz) < 0.9) { return false; }
  if (dl(N.pos.x, N.pos.y, N.pos.z, M.pos.x, M.pos.y, M.pos.z, dx, dy, dz) < 0.9) { return false; }
  return true;
}

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z; pnx = N.pos.x; pny = N.pos.y; pnz = N.pos.z;
}

Update {
  // Точки не выходят за поле (движок в 3D их не удерживает): лишнее срезается по осям.
  if (abs(A.pos.x) > 4.3 || abs(A.pos.y) > 4.3 || abs(A.pos.z) > 4.3) { A.pos.x = cl4(A.pos.x); A.pos.y = cl4(A.pos.y); A.pos.z = cl4(A.pos.z); }
  if (abs(B.pos.x) > 4.3 || abs(B.pos.y) > 4.3 || abs(B.pos.z) > 4.3) { B.pos.x = cl4(B.pos.x); B.pos.y = cl4(B.pos.y); B.pos.z = cl4(B.pos.z); }
  if (abs(M.pos.x) > 4.3 || abs(M.pos.y) > 4.3 || abs(M.pos.z) > 4.3) { M.pos.x = cl4(M.pos.x); M.pos.y = cl4(M.pos.y); M.pos.z = cl4(M.pos.z); }
  if (abs(N.pos.x) > 4.3 || abs(N.pos.y) > 4.3 || abs(N.pos.z) > 4.3) { N.pos.x = cl4(N.pos.x); N.pos.y = cl4(N.pos.y); N.pos.z = cl4(N.pos.z); }
  if (ok()) {
    pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
    pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z; pnx = N.pos.x; pny = N.pos.y; pnz = N.pos.z;
  } else {
    A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz;
    M.pos.x = pmx; M.pos.y = pmy; M.pos.z = pmz; N.pos.x = pnx; N.pos.y = pny; N.pos.z = pnz;
  }
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; float dz = B.pos.z - A.pos.z;
  float len = sqrt(dx * dx + dy * dy + dz * dz);
  float ux = dx / len; float uy = dy / len; float uz = dz / len;
  float tm1 = min(tb(M.pos.x, -ux, 4.3), tb(M.pos.y, -uy, 4.3), tb(M.pos.z, -uz, 4.3));
  float tm2 = min(tb(M.pos.x, ux, 4.3), tb(M.pos.y, uy, 4.3), tb(M.pos.z, uz, 4.3));
  float tn1 = min(tb(N.pos.x, -ux, 4.3), tb(N.pos.y, -uy, 4.3), tb(N.pos.z, -uz, 4.3));
  float tn2 = min(tb(N.pos.x, ux, 4.3), tb(N.pos.y, uy, 4.3), tb(N.pos.z, uz, 4.3));
  M1.pos.x = M.pos.x - ux * tm1; M1.pos.y = M.pos.y - uy * tm1; M1.pos.z = M.pos.z - uz * tm1;
  M2.pos.x = M.pos.x + ux * tm2; M2.pos.y = M.pos.y + uy * tm2; M2.pos.z = M.pos.z + uz * tm2;
  N1.pos.x = N.pos.x - ux * tn1; N1.pos.y = N.pos.y - uy * tn1; N1.pos.z = N.pos.z - uz * tn1;
  N2.pos.x = N.pos.x + ux * tn2; N2.pos.y = N.pos.y + uy * tn2; N2.pos.z = N.pos.z + uz * tn2;
  float dab = dl(M.pos.x, M.pos.y, M.pos.z, A.pos.x, A.pos.y, A.pos.z, dx, dy, dz);
  float dac = dl(N.pos.x, N.pos.y, N.pos.z, A.pos.x, A.pos.y, A.pos.z, dx, dy, dz);
  float dbc = dl(N.pos.x, N.pos.y, N.pos.z, M.pos.x, M.pos.y, M.pos.z, dx, dy, dz);

  info = "**Свойства параллельных прямых в пространстве.** Прямая a = AB, прямая b (синяя) проходит через M, прямая c (жёлтая) — через N; обе параллельны a, у всех трёх один направляющий вектор AB = (" + num(dx, 1) + "; " + num(dy, 1) + "; " + num(dz, 1) + ").\n\n";
  info = info + "**Через точку вне прямой** проходит ровно одна прямая, параллельная данной: через M — b, через N — c; расстояние от a до b равно " + num(dab, 2) + ", от a до c — " + num(dac, 2) + ".\n\n";
  info = info + "**Транзитивность.** b ∥ a и c ∥ a, поэтому b ∥ c: направляющие коллинеарны (угол между ними 0°), прямые лежат в одной плоскости (жёлтая) и не пересекаются; расстояние между b и c — " + num(dbc, 2) + ". Прямые a и b тоже лежат в одной плоскости (синяя).";
}
]
