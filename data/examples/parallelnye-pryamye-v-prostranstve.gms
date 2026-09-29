[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 70);
camera start zoom = 1.2;

// ---- Прямая a = P1P2 и прямая b через точку Q с тем же направляющим вектором
// (P1, P2, Q перетаскиваются; b пересчитывается вслед за a). Обе лежат в одной
// плоскости P1P2Q и не пересекаются. Зелёный отрезок XY — общий перпендикуляр:
// X бежит по a (ползунок), Y — соответствующая точка b; длина XY не меняется. ----
new Point3D { name = "P1"; pos = (-3, -2, -1); text = true("P₁"); pauseOnDrag = false }
new Point3D { name = "P2"; pos = (3, -1, 1); text = true("P₂"); pauseOnDrag = false }
new Point3D { name = "Q"; pos = (-1, 2, 2); text = true("Q"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "X"; pos = (0, 0, 0); text = true("X"); color = #22c55e; dynamic = false; collision = false; active = showXY > 0.5 }
new Point3D { name = "Y"; pos = (0, 0, 0); text = true("Y"); color = #22c55e; dynamic = false; collision = false; active = showXY > 0.5 }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "A2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
draw InfPlane { name = "plane"; points = (P1, P2, Q); size = 4.5; opacity = 0.25; color = #3b82f6 }
new Line3D { name = "la"; pos = (A1, A2); interact = false; thickness = 4 }
new Line3D { name = "lb"; pos = (B1, B2); interact = false; thickness = 4; color = #f59e0b }
new Line3D { name = "xy"; pos = (X, Y); interact = false; thickness = 2; color = #22c55e; active = showXY > 0.5 }

new UI { name = "sS"; type = slider; label = "положение X"; variable = ss; min = 0.1; max = 0.9; step = 0.01; default = 0.3 }

// ---- Логика ----
float ss = 0.3; float showXY = 1;
string info = "";
float p1x = 0; float p1y = 0; float p1z = 0;
float p2x = 0; float p2y = 0; float p2z = 0;
float pqx = 0; float pqy = 0; float pqz = 0;
float hx = 4.3; float hy = 4.3; float hz = 4.3;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function inField3(x, y, z) { return abs(x) <= hx && abs(y) <= hy && abs(z) <= hz; }
Function area2(p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z) {
  float ux = p2x - p1x; float uy = p2y - p1y; float uz = p2z - p1z;
  float vx = p3x - p1x; float vy = p3y - p1y; float vz = p3z - p1z;
  float cx = uy * vz - uz * vy; float cy = uz * vx - ux * vz; float cz = ux * vy - uy * vx;
  return sqrt(cx * cx + cy * cy + cz * cz);
}
// Допустимо, если прямая MN не вырождена (|MN| ≥ 1,5) и K отстоит от неё не менее чем на 0,8.
Function okLine(ax, ay, az, bx, by, bz, kx, ky, kz) {
  if (!inField3(ax, ay, az) || !inField3(bx, by, bz) || !inField3(kx, ky, kz)) { return false; }
  float l = sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay) + (bz - az) * (bz - az));
  if (l < 1.5) { return false; }
  return area2(ax, ay, az, bx, by, bz, kx, ky, kz) / l >= 0.8;
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

Start {
  p1x = P1.pos.x; p1y = P1.pos.y; p1z = P1.pos.z;
  p2x = P2.pos.x; p2y = P2.pos.y; p2z = P2.pos.z;
  pqx = Q.pos.x; pqy = Q.pos.y; pqz = Q.pos.z;
}

Update {
  float m1 = abs(P1.pos.x - p1x) + abs(P1.pos.y - p1y) + abs(P1.pos.z - p1z);
  float m2 = abs(P2.pos.x - p2x) + abs(P2.pos.y - p2y) + abs(P2.pos.z - p2z);
  float mq = abs(Q.pos.x - pqx) + abs(Q.pos.y - pqy) + abs(Q.pos.z - pqz);
  float m = max(m1, m2, mq);
  if (m > 0.000001) {
    if (m1 == m) {
      if (okLine(P1.pos.x, P1.pos.y, P1.pos.z, p2x, p2y, p2z, pqx, pqy, pqz)) { p1x = P1.pos.x; p1y = P1.pos.y; p1z = P1.pos.z; } else { P1.pos.x = p1x; P1.pos.y = p1y; P1.pos.z = p1z; }
    } else if (m2 == m) {
      if (okLine(p1x, p1y, p1z, P2.pos.x, P2.pos.y, P2.pos.z, pqx, pqy, pqz)) { p2x = P2.pos.x; p2y = P2.pos.y; p2z = P2.pos.z; } else { P2.pos.x = p2x; P2.pos.y = p2y; P2.pos.z = p2z; }
    } else {
      if (okLine(p1x, p1y, p1z, p2x, p2y, p2z, Q.pos.x, Q.pos.y, Q.pos.z)) { pqx = Q.pos.x; pqy = Q.pos.y; pqz = Q.pos.z; } else { Q.pos.x = pqx; Q.pos.y = pqy; Q.pos.z = pqz; }
    }
  }

  // Направляющий вектор прямой a (единичный) — он же у прямой b.
  float ax = P2.pos.x - P1.pos.x; float ay = P2.pos.y - P1.pos.y; float az = P2.pos.z - P1.pos.z;
  float al = sqrt(ax * ax + ay * ay + az * az);
  float ux = ax / al; float uy = ay / al; float uz = az / al;
  float alo = clipLo(P1.pos.x, P1.pos.y, P1.pos.z, ux, uy, uz); float ahi = clipHi(P1.pos.x, P1.pos.y, P1.pos.z, ux, uy, uz);
  float blo = clipLo(Q.pos.x, Q.pos.y, Q.pos.z, ux, uy, uz); float bhi = clipHi(Q.pos.x, Q.pos.y, Q.pos.z, ux, uy, uz);
  A1.pos.x = P1.pos.x + ux * alo; A1.pos.y = P1.pos.y + uy * alo; A1.pos.z = P1.pos.z + uz * alo;
  A2.pos.x = P1.pos.x + ux * ahi; A2.pos.y = P1.pos.y + uy * ahi; A2.pos.z = P1.pos.z + uz * ahi;
  B1.pos.x = Q.pos.x + ux * blo; B1.pos.y = Q.pos.y + uy * blo; B1.pos.z = Q.pos.z + uz * blo;
  B2.pos.x = Q.pos.x + ux * bhi; B2.pos.y = Q.pos.y + uy * bhi; B2.pos.z = Q.pos.z + uz * bhi;

  // Общий перпендикуляр: h — вектор от прямой a к прямой b (из Q вычитается проекция на a).
  float qd = (Q.pos.x - P1.pos.x) * ux + (Q.pos.y - P1.pos.y) * uy + (Q.pos.z - P1.pos.z) * uz;
  float hvx = Q.pos.x - P1.pos.x - qd * ux; float hvy = Q.pos.y - P1.pos.y - qd * uy; float hvz = Q.pos.z - P1.pos.z - qd * uz;
  float h = sqrt(hvx * hvx + hvy * hvy + hvz * hvz);
  X.pos.x = P1.pos.x + ss * ax; X.pos.y = P1.pos.y + ss * ay; X.pos.z = P1.pos.z + ss * az;
  Y.pos.x = X.pos.x + hvx; Y.pos.y = X.pos.y + hvy; Y.pos.z = X.pos.z + hvz;
  showXY = 0;
  if (inField3(Y.pos.x, Y.pos.y, Y.pos.z)) { showXY = 1; }

  string dirs = "d = (" + num(ux, 2) + "; " + num(uy, 2) + "; " + num(uz, 2) + ")";
  info = "**Параллельные прямые** a и b лежат в одной плоскости (синяя) и не пересекаются. Их направляющие векторы коллинеарны: у обеих " + dirs + " (в единичной записи).\n\n**Расстояние между ними постоянно:** " + format(h, 2) + " в любой точке — ";
  if (showXY > 0.5) { info = info + "длина общего перпендикуляра XY (X ∈ a, Y ∈ b) равна " + format(h, 2) + " при любом положении X."; }
  else { info = info + "отрезок XY при таком положении X выходит за пределы поля и не показан, но его длина всё равно " + format(h, 2) + "."; }
  info = info + "\n\nЧерез точку Q вне прямой a проходит ровно одна прямая, параллельная a, — это b; две параллельные прямые определяют единственную плоскость.";
}
]
