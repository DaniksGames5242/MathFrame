[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (35, 65);
camera start zoom = 1.35;

// ---- Плоскость α задана точками A, B, C (свободны). Прямая a проходит через свободную
// точку M и всегда параллельна α: её направление лежит в α (ползунок φ поворачивает его).
// H — основание перпендикуляра из M на α; X ∈ a (ползунок), X' — её проекция на α. ----
new Point3D { name = "A"; pos = (-3, -2.5, -2); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (3, -2.5, -1.5); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (0, -2, 3); text = true("C"); pauseOnDrag = false }
new Point3D { name = "M"; pos = (-1, 1.5, 0); text = true("M"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "H"; pos = (0, 0, 0); text = true("H"); color = #22c55e; dynamic = false; collision = false }
new Point3D { name = "X"; pos = (0, 0, 0); text = true("X"); color = #3b82f6; dynamic = false; collision = false }
new Point3D { name = "Y"; pos = (0, 0, 0); text = true("X'"); color = #3b82f6; dynamic = false; collision = false }
new Point3D { name = "L1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "L2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "la"; pos = (L1, L2); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "mh"; pos = (M, H); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "xy"; pos = (X, Y); interact = false; thickness = 2; color = #3b82f6 }
draw InfPlane { name = "alpha"; points = (A, B, C); size = 3.6; opacity = 0.14; color = #3b82f6 }

new UI { name = "sPhi"; type = slider; label = "направление прямой a в плоскости α, °"; variable = phi; min = 0; max = 180; step = 1; default = 30 }
new UI { name = "sS"; type = slider; label = "положение X на прямой a: MX"; variable = s; min = -4; max = 4; step = 0.05; default = 2.5 }

string info = "";
float phi = 30; float s = 2.5;
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;
float pmx = 0; float pmy = 0; float pmz = 0;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function tb(m, d, h) {
  if (d > 0.000001) { return (h - m) / d; }
  if (d < -0.000001) { return (-h - m) / d; }
  return 1000;
}
Function inF(x, y, z) { return abs(x) <= 4.3 && abs(y) <= 4.3 && abs(z) <= 4.3; }
// Допустимо: A, B, C не на одной прямой, M вне α, основание H перпендикуляра в поле.
Function ok() {
  if (!inF(A.pos.x, A.pos.y, A.pos.z) || !inF(B.pos.x, B.pos.y, B.pos.z) || !inF(C.pos.x, C.pos.y, C.pos.z) || !inF(M.pos.x, M.pos.y, M.pos.z)) { return false; }
  float bx = B.pos.x - A.pos.x; float by = B.pos.y - A.pos.y; float bz = B.pos.z - A.pos.z;
  float cx = C.pos.x - A.pos.x; float cy = C.pos.y - A.pos.y; float cz = C.pos.z - A.pos.z;
  float nx = by * cz - bz * cy; float ny = bz * cx - bx * cz; float nz = bx * cy - by * cx;
  float nl = sqrt(nx * nx + ny * ny + nz * nz);
  if (nl < 3) { return false; }
  float t = ((M.pos.x - A.pos.x) * nx + (M.pos.y - A.pos.y) * ny + (M.pos.z - A.pos.z) * nz) / nl;
  if (abs(t) < 0.7) { return false; }
  return inF(M.pos.x - t * nx / nl, M.pos.y - t * ny / nl, M.pos.z - t * nz / nl);
}

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z;
}

Update {
  if (ok()) {
    pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
    pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z;
  } else {
    A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz;
    C.pos.x = pcx; C.pos.y = pcy; C.pos.z = pcz; M.pos.x = pmx; M.pos.y = pmy; M.pos.z = pmz;
  }
  float bx = B.pos.x - A.pos.x; float by = B.pos.y - A.pos.y; float bz = B.pos.z - A.pos.z;
  float cx = C.pos.x - A.pos.x; float cy = C.pos.y - A.pos.y; float cz = C.pos.z - A.pos.z;
  float nx = by * cz - bz * cy; float ny = bz * cx - bx * cz; float nz = bx * cy - by * cx;
  float nl = sqrt(nx * nx + ny * ny + nz * nz);
  float ex = nx / nl; float ey = ny / nl; float ez = nz / nl;
  float t = (M.pos.x - A.pos.x) * ex + (M.pos.y - A.pos.y) * ey + (M.pos.z - A.pos.z) * ez;
  H.pos.x = M.pos.x - t * ex; H.pos.y = M.pos.y - t * ey; H.pos.z = M.pos.z - t * ez;
  // Ортонормированный базис плоскости: e1 ∥ AB, e2 = ex × e1.
  float bl = sqrt(bx * bx + by * by + bz * bz);
  float e1x = bx / bl; float e1y = by / bl; float e1z = bz / bl;
  float e2x = ey * e1z - ez * e1y; float e2y = ez * e1x - ex * e1z; float e2z = ex * e1y - ey * e1x;
  float cp = cos(radians(phi)); float sp = sin(radians(phi));
  float ux = cp * e1x + sp * e2x; float uy = cp * e1y + sp * e2y; float uz = cp * e1z + sp * e2z;
  float m1 = min(tb(M.pos.x, -ux, 4.3), tb(M.pos.y, -uy, 4.3), tb(M.pos.z, -uz, 4.3));
  float m2 = min(tb(M.pos.x, ux, 4.3), tb(M.pos.y, uy, 4.3), tb(M.pos.z, uz, 4.3));
  L1.pos.x = M.pos.x - ux * m1; L1.pos.y = M.pos.y - uy * m1; L1.pos.z = M.pos.z - uz * m1;
  L2.pos.x = M.pos.x + ux * m2; L2.pos.y = M.pos.y + uy * m2; L2.pos.z = M.pos.z + uz * m2;
  // X ∈ a, X' = X + (H − M) ∈ α; оба должны остаться в поле.
  float wx = H.pos.x - M.pos.x; float wy = H.pos.y - M.pos.y; float wz = H.pos.z - M.pos.z;
  float h1 = min(tb(H.pos.x, -ux, 4.3), tb(H.pos.y, -uy, 4.3), tb(H.pos.z, -uz, 4.3));
  float h2 = min(tb(H.pos.x, ux, 4.3), tb(H.pos.y, uy, 4.3), tb(H.pos.z, uz, 4.3));
  float se = max(-min(m1, h1), min(min(m2, h2), s));
  X.pos.x = M.pos.x + se * ux; X.pos.y = M.pos.y + se * uy; X.pos.z = M.pos.z + se * uz;
  Y.pos.x = X.pos.x + wx; Y.pos.y = X.pos.y + wy; Y.pos.z = X.pos.z + wz;
  float xy = sqrt(wx * wx + wy * wy + wz * wz);
  float dx = (X.pos.x - A.pos.x) * ex + (X.pos.y - A.pos.y) * ey + (X.pos.z - A.pos.z) * ez;
  float un = ux * ex + uy * ey + uz * ez;
  float p0 = A.pos.x * ex + A.pos.y * ey + A.pos.z * ez;
  float r0 = M.pos.x * ex + M.pos.y * ey + M.pos.z * ez;

  info = "**Расстояние между прямой a и параллельной ей плоскостью α.** Прямая a (жёлтая) проходит через M и параллельна α (синей): её направляющий вектор лежит в α, направляющий вектор · нормаль = " + num(un, 2) + ". Общих точек нет, все точки a удалены от α на одно и то же расстояние.\n\n";
  info = info + "Нормальное уравнение α: n = (" + num(ex, 2) + "; " + num(ey, 2) + "; " + num(ez, 2) + "), p = " + num(p0, 2) + ". Для точки M: |r₀ · n − p| = |" + num(r0, 2) + " − " + (p0 < 0 ? "(" + num(p0, 2) + ")" : num(p0, 2)) + "| = **" + num(abs(r0 - p0), 2) + "** — длина перпендикуляра MH.\n\n";
  if (abs(se) < 0.05) {
    info = info + "**Не зависит от точки.** X совпала с M: расстояние от неё до α — " + num(abs(dx), 2) + ".";
  } else {
    info = info + "**Не зависит от точки.** Для X ∈ a (MX = " + num(abs(se), 2) + ") перпендикуляр XX' ∥ MH, XX' = " + num(xy, 2) + ", расстояние от X до α — " + num(abs(dx), 2) + ": смещение вдоль a его не меняет.";
  }
}
]
