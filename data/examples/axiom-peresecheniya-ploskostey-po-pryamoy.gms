[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 70);
camera start zoom = 1.2;

// ---- Две плоскости: ABC и PQR, каждая — своя тройка перетаскиваемых точек. Если
// плоскости не параллельны, их пересечение — прямая; она вычисляется в Update через
// векторное произведение нормалей и рисуется как отрезок через всё поле. ----
new Point3D { name = "A"; pos = (-3, -2, -1); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (3, -1, 0); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (0, 3, -2); text = true("C"); pauseOnDrag = false }
draw InfPlane { name = "planeABC"; points = (A, B, C); size = 4.5; opacity = 0.22; color = #3b82f6 }

new Point3D { name = "P"; pos = (-2, -3, 2); text = true("P"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "Q"; pos = (2, 2, 3); text = true("Q"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "R"; pos = (-1, 1, -3); text = true("R"); color = #f59e0b; pauseOnDrag = false }
draw InfPlane { name = "planePQR"; points = (P, Q, R); size = 4.5; opacity = 0.22; color = #f59e0b }

new Point3D { name = "L1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "L2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "lineX"; pos = (L1, L2); interact = false; thickness = 4; color = #22c55e; active = showL > 0.5 }

// ---- Логика ----
string info = "";
float showL = 0;
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;
float pdx = 0; float pdy = 0; float pdz = 0;
float pex = 0; float pey = 0; float pez = 0;
float pfx = 0; float pfy = 0; float pfz = 0;
float hx = 4.3; float hy = 4.3; float hz = 4.3;

Function inField3(x, y, z) { return abs(x) <= hx && abs(y) <= hy && abs(z) <= hz; }
Function area2(p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z) {
  float ux = p2x - p1x; float uy = p2y - p1y; float uz = p2z - p1z;
  float vx = p3x - p1x; float vy = p3y - p1y; float vz = p3z - p1z;
  float cx = uy * vz - uz * vy; float cy = uz * vx - ux * vz; float cz = ux * vy - uy * vx;
  return sqrt(cx * cx + cy * cy + cz * cz);
}
Function okTri(px, py, pz, q1x, q1y, q1z, q2x, q2y, q2z) {
  if (!inField3(px, py, pz)) { return false; }
  return area2(px, py, pz, q1x, q1y, q1z, q2x, q2y, q2z) >= 1.2;
}
Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z;
  pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z;
  pdx = P.pos.x; pdy = P.pos.y; pdz = P.pos.z;
  pex = Q.pos.x; pey = Q.pos.y; pez = Q.pos.z;
  pfx = R.pos.x; pfy = R.pos.y; pfz = R.pos.z;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay) + abs(A.pos.z - paz);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby) + abs(B.pos.z - pbz);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy) + abs(C.pos.z - pcz);
  float mABC = max(mA, mB, mC);
  if (mABC > 0.000001) {
    if (mA == mABC) { if (okTri(A.pos.x, A.pos.y, A.pos.z, pbx, pby, pbz, pcx, pcy, pcz)) { pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; } else { A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; } }
    else if (mB == mABC) { if (okTri(B.pos.x, B.pos.y, B.pos.z, pax, pay, paz, pcx, pcy, pcz)) { pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z; } else { B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz; } }
    else { if (okTri(C.pos.x, C.pos.y, C.pos.z, pax, pay, paz, pbx, pby, pbz)) { pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; } else { C.pos.x = pcx; C.pos.y = pcy; C.pos.z = pcz; } }
  }
  float mD = abs(P.pos.x - pdx) + abs(P.pos.y - pdy) + abs(P.pos.z - pdz);
  float mE = abs(Q.pos.x - pex) + abs(Q.pos.y - pey) + abs(Q.pos.z - pez);
  float mF = abs(R.pos.x - pfx) + abs(R.pos.y - pfy) + abs(R.pos.z - pfz);
  float mPQR = max(mD, mE, mF);
  if (mPQR > 0.000001) {
    if (mD == mPQR) { if (okTri(P.pos.x, P.pos.y, P.pos.z, pex, pey, pez, pfx, pfy, pfz)) { pdx = P.pos.x; pdy = P.pos.y; pdz = P.pos.z; } else { P.pos.x = pdx; P.pos.y = pdy; P.pos.z = pdz; } }
    else if (mE == mPQR) { if (okTri(Q.pos.x, Q.pos.y, Q.pos.z, pdx, pdy, pdz, pfx, pfy, pfz)) { pex = Q.pos.x; pey = Q.pos.y; pez = Q.pos.z; } else { Q.pos.x = pex; Q.pos.y = pey; Q.pos.z = pez; } }
    else { if (okTri(R.pos.x, R.pos.y, R.pos.z, pdx, pdy, pdz, pex, pey, pez)) { pfx = R.pos.x; pfy = R.pos.y; pfz = R.pos.z; } else { R.pos.x = pfx; R.pos.y = pfy; R.pos.z = pfz; } }
  }

  float u1x = B.pos.x - A.pos.x; float u1y = B.pos.y - A.pos.y; float u1z = B.pos.z - A.pos.z;
  float v1x = C.pos.x - A.pos.x; float v1y = C.pos.y - A.pos.y; float v1z = C.pos.z - A.pos.z;
  float n1x = u1y * v1z - u1z * v1y; float n1y = u1z * v1x - u1x * v1z; float n1z = u1x * v1y - u1y * v1x;

  float u2x = Q.pos.x - P.pos.x; float u2y = Q.pos.y - P.pos.y; float u2z = Q.pos.z - P.pos.z;
  float v2x = R.pos.x - P.pos.x; float v2y = R.pos.y - P.pos.y; float v2z = R.pos.z - P.pos.z;
  float n2x = u2y * v2z - u2z * v2y; float n2y = u2z * v2x - u2x * v2z; float n2z = u2x * v2y - u2y * v2x;

  // Направление линии пересечения — векторное произведение нормалей.
  float dx = n1y * n2z - n1z * n2y; float dy = n1z * n2x - n1x * n2z; float dz = n1x * n2y - n1y * n2x;
  float dl = sqrt(dx * dx + dy * dy + dz * dz);

  if (dl < 0.15) {
    showL = 0;
    info = "**Аксиома:** если две различные плоскости имеют общую точку, то множество их общих точек — прямая.\n\nСейчас плоскости ABC и PQR почти параллельны (их нормали почти совпадают по направлению) — общих точек нет, пересекать нечего.";
  } else {
    // Точка на линии пересечения — стандартная формула для точки, ближайшей к началу
    // координат, на прямой n1·X = k1, n2·X = k2, где d = n1 × n2:
    // p0 = (k1 (n2 × d) + k2 (d × n1)) / |d|².
    float k1 = n1x * A.pos.x + n1y * A.pos.y + n1z * A.pos.z;
    float k2 = n2x * P.pos.x + n2y * P.pos.y + n2z * P.pos.z;
    float ax = n2y * dz - n2z * dy; float ay = n2z * dx - n2x * dz; float az = n2x * dy - n2y * dx;
    float bx = dy * n1z - dz * n1y; float by = dz * n1x - dx * n1z; float bz = dx * n1y - dy * n1x;
    float dl2 = dl * dl;
    float px = (k1 * ax + k2 * bx) / dl2;
    float py = (k1 * ay + k2 * by) / dl2;
    float pz = (k1 * az + k2 * bz) / dl2;

    // Отрезок прямой обрезается кубом поля: параметр t (по единичному направлению)
    // ограничивается по каждой оси.
    float ux = dx / dl; float uy = dy / dl; float uz = dz / dl;
    float lo = -100; float hi = 100; float hh = 4.5;
    if (abs(ux) > 0.000001) { lo = max(lo, min((-hh - px) / ux, (hh - px) / ux)); hi = min(hi, max((-hh - px) / ux, (hh - px) / ux)); }
    if (abs(uy) > 0.000001) { lo = max(lo, min((-hh - py) / uy, (hh - py) / uy)); hi = min(hi, max((-hh - py) / uy, (hh - py) / uy)); }
    if (abs(uz) > 0.000001) { lo = max(lo, min((-hh - pz) / uz, (hh - pz) / uz)); hi = min(hi, max((-hh - pz) / uz, (hh - pz) / uz)); }
    if (hi - lo > 0.3) {
      L1.pos.x = px + ux * lo; L1.pos.y = py + uy * lo; L1.pos.z = pz + uz * lo;
      L2.pos.x = px + ux * hi; L2.pos.y = py + uy * hi; L2.pos.z = pz + uz * hi;
      showL = 1;
    } else { showL = 0; }
    info = "**Аксиома:** если две различные плоскости имеют общую точку, то множество всех их общих точек образует прямую.\n\nПлоскости ABC (синяя) и PQR (жёлтая) пересекаются по прямой (зелёная) — она содержит все точки, общие для обеих плоскостей: пересечение не может быть отдельной точкой или более сложной фигурой.";
  }
}
]
