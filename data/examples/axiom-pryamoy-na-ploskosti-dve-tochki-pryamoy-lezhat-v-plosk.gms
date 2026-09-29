[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 70);
camera start zoom = 1.2;

// ---- Плоскость через A, B, C (перетаскиваются). Прямая через P, Q (перетаскиваются
// свободно) рисуется во весь объём поля — её концы L1, L2 вычисляются в Update далеко
// за P и Q в направлении PQ, чтобы прямая выглядела бесконечной. Если у прямой в
// плоскости лежат обе точки P и Q, то (по аксиоме) и вся прямая лежит в плоскости —
// линия целиком окрашивается в цвет плоскости; если в плоскости лежит только одна
// точка, это единственная общая точка прямой и плоскости — она отмечена отдельно. ----
new Point3D { name = "A"; pos = (-3, -2, -1); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (3, -1, 2); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (0, 3, -2); text = true("C"); pauseOnDrag = false }
draw InfPlane { name = "plane"; points = (A, B, C); size = 4.5; opacity = 0.25; color = #3b82f6 }

new Point3D { name = "P"; pos = (-2, 1, -3); text = true("P"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "Q"; pos = (2, -1.5, 1); text = true("Q"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "L1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "L2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "pq"; pos = (L1, L2); interact = false; thickness = 4 }

// Общая точка прямой и плоскости, когда она ровно одна (не совпадает ни с P, ни с Q).
new Point3D { name = "X"; pos = (0, 0, 0); dynamic = false; collision = false; color = #22c55e; active = false }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;
float ppx = 0; float ppy = 0; float ppz = 0;
float pqx = 0; float pqy = 0; float pqz = 0;
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

Function clipLo(px, py, pz, ux, uy, uz) {
  float lo = -100; float hh = 4.5;
  if (abs(ux) > 0.000001) { lo = max(lo, min((-hh - px) / ux, (hh - px) / ux)); }
  if (abs(uy) > 0.000001) { lo = max(lo, min((-hh - py) / uy, (hh - py) / uy)); }
  if (abs(uz) > 0.000001) { lo = max(lo, min((-hh - pz) / uz, (hh - pz) / uz)); }
  return lo;
}
Function clipHi(px, py, pz, ux, uy, uz) {
  float hi = 100; float hh = 4.5;
  if (abs(ux) > 0.000001) { hi = min(hi, max((-hh - px) / ux, (hh - px) / ux)); }
  if (abs(uy) > 0.000001) { hi = min(hi, max((-hh - py) / uy, (hh - py) / uy)); }
  if (abs(uz) > 0.000001) { hi = min(hi, max((-hh - pz) / uz, (hh - pz) / uz)); }
  return hi;
}

// Нормаль плоскости ABC (не нормированная).
float nx = 0; float ny = 0; float nz = 0;
Function dist(px, py, pz) {
  return ((px - A.pos.x) * nx + (py - A.pos.y) * ny + (pz - A.pos.z) * nz) / sqrt(nx * nx + ny * ny + nz * nz);
}

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z;
  pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z;
  ppx = P.pos.x; ppy = P.pos.y; ppz = P.pos.z;
  pqx = Q.pos.x; pqy = Q.pos.y; pqz = Q.pos.z;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay) + abs(A.pos.z - paz);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby) + abs(B.pos.z - pbz);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy) + abs(C.pos.z - pcz);
  float m = max(mA, mB, mC);
  if (m > 0.000001) {
    if (mA == m) { if (okTri(A.pos.x, A.pos.y, A.pos.z, pbx, pby, pbz, pcx, pcy, pcz)) { pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; } else { A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; } }
    else if (mB == m) { if (okTri(B.pos.x, B.pos.y, B.pos.z, pax, pay, paz, pcx, pcy, pcz)) { pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z; } else { B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz; } }
    else { if (okTri(C.pos.x, C.pos.y, C.pos.z, pax, pay, paz, pbx, pby, pbz)) { pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; } else { C.pos.x = pcx; C.pos.y = pcy; C.pos.z = pcz; } }
  }
  if (inField3(P.pos.x, P.pos.y, P.pos.z)) { ppx = P.pos.x; ppy = P.pos.y; ppz = P.pos.z; } else { P.pos.x = ppx; P.pos.y = ppy; P.pos.z = ppz; }
  if (inField3(Q.pos.x, Q.pos.y, Q.pos.z)) { pqx = Q.pos.x; pqy = Q.pos.y; pqz = Q.pos.z; } else { Q.pos.x = pqx; Q.pos.y = pqy; Q.pos.z = pqz; }

  float ux = B.pos.x - A.pos.x; float uy = B.pos.y - A.pos.y; float uz = B.pos.z - A.pos.z;
  float vx = C.pos.x - A.pos.x; float vy = C.pos.y - A.pos.y; float vz = C.pos.z - A.pos.z;
  nx = uy * vz - uz * vy; ny = uz * vx - ux * vz; nz = ux * vy - uy * vx;

  // Точка вблизи плоскости «прилипает» к ней: попасть в неё мышью в 3D иначе почти нельзя.
  float nl = sqrt(nx * nx + ny * ny + nz * nz);
  float e1 = dist(P.pos.x, P.pos.y, P.pos.z);
  if (abs(e1) < 0.4 && abs(e1) > 0.0001) {
    float sx = P.pos.x - e1 * nx / nl; float sy = P.pos.y - e1 * ny / nl; float sz = P.pos.z - e1 * nz / nl;
    if (inField3(sx, sy, sz)) { P.pos.x = sx; P.pos.y = sy; P.pos.z = sz; ppx = sx; ppy = sy; ppz = sz; }
  }
  float e2 = dist(Q.pos.x, Q.pos.y, Q.pos.z);
  if (abs(e2) < 0.4 && abs(e2) > 0.0001) {
    float sx = Q.pos.x - e2 * nx / nl; float sy = Q.pos.y - e2 * ny / nl; float sz = Q.pos.z - e2 * nz / nl;
    if (inField3(sx, sy, sz)) { Q.pos.x = sx; Q.pos.y = sy; Q.pos.z = sz; pqx = sx; pqy = sy; pqz = sz; }
  }

  // Прямая PQ рисуется отрезком, обрезанным кубом поля.
  float dx = Q.pos.x - P.pos.x; float dy = Q.pos.y - P.pos.y; float dz = Q.pos.z - P.pos.z;
  float dl = sqrt(dx * dx + dy * dy + dz * dz);
  if (dl < 1) { dl = 1; }
  float ux = dx / dl; float uy = dy / dl; float uz = dz / dl;
  float lo = clipLo(P.pos.x, P.pos.y, P.pos.z, ux, uy, uz);
  float hi = clipHi(P.pos.x, P.pos.y, P.pos.z, ux, uy, uz);
  L1.pos.x = P.pos.x + ux * lo; L1.pos.y = P.pos.y + uy * lo; L1.pos.z = P.pos.z + uz * lo;
  L2.pos.x = P.pos.x + ux * hi; L2.pos.y = P.pos.y + uy * hi; L2.pos.z = P.pos.z + uz * hi;

  float dP = dist(P.pos.x, P.pos.y, P.pos.z);
  float dQ = dist(Q.pos.x, Q.pos.y, Q.pos.z);
  float inP = abs(dP) < 0.05; float inQ = abs(dQ) < 0.05;

  if (inP && inQ) {
    X.active = false;
    info = "**Аксиома:** если две точки прямой принадлежат плоскости, то вся прямая целиком лежит в этой плоскости.\n\nСейчас у прямой PQ обе точки P и Q лежат в плоскости ABC (закрашена) — значит, вся прямая PQ, продолженная в обе стороны, целиком лежит в этой плоскости.";
  } else if (inP != inQ) {
    X.pos.x = P.pos.x; X.pos.y = P.pos.y; X.pos.z = P.pos.z;
    if (inQ) { X.pos.x = Q.pos.x; X.pos.y = Q.pos.y; X.pos.z = Q.pos.z; }
    X.active = true;
    info = "**Аксиома:** если две точки прямой принадлежат плоскости, то вся прямая целиком лежит в этой плоскости.\n\nСейчас в плоскости ABC лежит только одна из точек P, Q — по аксиоме это означает, что прямая PQ **не лежит** в плоскости целиком: у прямой и плоскости ровно одна общая точка (отмечена зелёным).";
  } else {
    X.active = false;
    info = "**Аксиома:** если две точки прямой принадлежат плоскости, то вся прямая целиком лежит в этой плоскости.\n\nСейчас ни P, ни Q не лежат в плоскости ABC — переместите обе точки на плоскость (закрашенную), чтобы увидеть, как прямая целиком в неё ложится.";
  }
}
]
