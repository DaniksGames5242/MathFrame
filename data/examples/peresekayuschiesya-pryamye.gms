[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 70);
camera start zoom = 1.2;

// ---- Прямая a = P1P2 (точки перетаскиваются) и прямая b, проходящая через точку O
// прямой a (ползунок t двигает O вдоль a) и точку Q вне a. У прямых по построению
// ровно одна общая точка O; обе лежат в плоскости P1P2Q. ----
new Point3D { name = "P1"; pos = (-3, -2, -1); text = true("P₁"); pauseOnDrag = false }
new Point3D { name = "P2"; pos = (3, -1, 1); text = true("P₂"); pauseOnDrag = false }
new Point3D { name = "Q"; pos = (-1, 3, 2); text = true("Q"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "O"; pos = (0, 0, 0); text = true("O"); color = #22c55e; dynamic = false; collision = false }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "A2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
draw InfPlane { name = "plane"; points = (P1, P2, Q); size = 4.5; opacity = 0.25; color = #3b82f6 }
new Line3D { name = "la"; pos = (A1, A2); interact = false; thickness = 4 }
new Line3D { name = "lb"; pos = (B1, B2); interact = false; thickness = 4; color = #f59e0b }

new UI { name = "sT"; type = slider; label = "положение O"; variable = tt; min = 0.15; max = 0.85; step = 0.01; default = 0.4 }

// ---- Логика ----
float tt = 0.4;
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

  // Точка пересечения O — на отрезке P1P2 (параметр t); прямая a — направление P1P2.
  float ax = P2.pos.x - P1.pos.x; float ay = P2.pos.y - P1.pos.y; float az = P2.pos.z - P1.pos.z;
  float al = sqrt(ax * ax + ay * ay + az * az);
  O.pos.x = P1.pos.x + tt * ax; O.pos.y = P1.pos.y + tt * ay; O.pos.z = P1.pos.z + tt * az;
  ax = ax / al; ay = ay / al; az = az / al;
  float bx = Q.pos.x - O.pos.x; float by = Q.pos.y - O.pos.y; float bz = Q.pos.z - O.pos.z;
  float bl = sqrt(bx * bx + by * by + bz * bz);
  bx = bx / bl; by = by / bl; bz = bz / bl;

  float alo = clipLo(O.pos.x, O.pos.y, O.pos.z, ax, ay, az); float ahi = clipHi(O.pos.x, O.pos.y, O.pos.z, ax, ay, az);
  float blo = clipLo(O.pos.x, O.pos.y, O.pos.z, bx, by, bz); float bhi = clipHi(O.pos.x, O.pos.y, O.pos.z, bx, by, bz);
  A1.pos.x = O.pos.x + ax * alo; A1.pos.y = O.pos.y + ay * alo; A1.pos.z = O.pos.z + az * alo;
  A2.pos.x = O.pos.x + ax * ahi; A2.pos.y = O.pos.y + ay * ahi; A2.pos.z = O.pos.z + az * ahi;
  B1.pos.x = O.pos.x + bx * blo; B1.pos.y = O.pos.y + by * blo; B1.pos.z = O.pos.z + bz * blo;
  B2.pos.x = O.pos.x + bx * bhi; B2.pos.y = O.pos.y + by * bhi; B2.pos.z = O.pos.z + bz * bhi;

  float th = acos(max(-1, min(1, ax * bx + ay * by + az * bz))) * 57.29578;
  float ang = th; if (ang > 90) { ang = 180 - ang; }
  string kind = "острый"; if (abs(ang - 90) < 0.5) { kind = "прямой"; }

  info = "**Пересекающиеся прямые** a и b лежат в одной плоскости (синяя) и имеют ровно одну общую точку O.\n\n**Углы при пересечении:** вертикальные углы равны, смежные дают в сумме 180°: " + format(th, 0) + "°, " + format(180 - th, 0) + "°, " + format(th, 0) + "°, " + format(180 - th, 0) + "°. **Угол между прямыми** — наименьший из них: " + format(ang, 0) + "° (" + kind + "), он не превосходит 90°.\n\nПрямая b не совпадает с a и не параллельна ей: расстояние от Q до a равно " + format(area2(P1.pos.x, P1.pos.y, P1.pos.z, P2.pos.x, P2.pos.y, P2.pos.z, Q.pos.x, Q.pos.y, Q.pos.z) / al, 2) + " > 0.";
}
]
