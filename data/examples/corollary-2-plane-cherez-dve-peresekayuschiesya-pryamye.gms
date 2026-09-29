[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 70);
camera start zoom = 1.2;

// ---- Две пересекающиеся прямые a = OX и b = OY (O, X, Y перетаскиваются). Плоскость
// строится по точкам O, X, Y. Зелёные точки Z ∈ a и W ∈ b (ползунки) — другие точки на
// тех же прямых: тройка O, Z, W даёт ту же плоскость (нормали совпадают). ----
new Point3D { name = "O"; pos = (-1, -1, 0); text = true("O"); pauseOnDrag = false }
new Point3D { name = "X"; pos = (3, 0, 2); text = true("X"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "Y"; pos = (0, 3, -2); text = true("Y"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "Z"; pos = (0, 0, 0); text = true("Z"); color = #22c55e; dynamic = false; collision = false }
new Point3D { name = "W"; pos = (0, 0, 0); text = true("W"); color = #22c55e; dynamic = false; collision = false }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "A2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
draw InfPlane { name = "plane"; points = (O, X, Y); size = 4.5; opacity = 0.25; color = #3b82f6 }
new Line3D { name = "la"; pos = (A1, A2); interact = false; thickness = 4 }
new Line3D { name = "lb"; pos = (B1, B2); interact = false; thickness = 4 }
new Line3D { name = "zw"; pos = (Z, W); interact = false; thickness = 2; color = #22c55e }

new UI { name = "sZ"; type = slider; label = "Z на a"; variable = sz; min = -3; max = 3; step = 0.1; default = 2 }
new UI { name = "sW"; type = slider; label = "W на b"; variable = sw; min = -3; max = 3; step = 0.1; default = -2 }

// ---- Логика ----
float sz = 2; float sw = -2;
string info = "";
float pox = 0; float poy = 0; float poz = 0;
float pxx = 0; float pxy = 0; float pxz = 0;
float pyx = 0; float pyy = 0; float pyz = 0;
float hx = 4.3; float hy = 4.3; float hz = 4.3;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function inField3(x, y, z) { return abs(x) <= hx && abs(y) <= hy && abs(z) <= hz; }
Function dist3(ax, ay, az, bx, by, bz) { return sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by) + (az - bz) * (az - bz)); }
Function area2(p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z) {
  float ux = p2x - p1x; float uy = p2y - p1y; float uz = p2z - p1z;
  float vx = p3x - p1x; float vy = p3y - p1y; float vz = p3z - p1z;
  float cx = uy * vz - uz * vy; float cy = uz * vx - ux * vz; float cz = ux * vy - uy * vx;
  return sqrt(cx * cx + cy * cy + cz * cz);
}
// Тройка допустима: точки различны (не ближе 1) и не лежат на одной прямой.
Function okT(px, py, pz, qx, qy, qz, rx, ry, rz) {
  if (!inField3(px, py, pz)) { return false; }
  if (dist3(px, py, pz, qx, qy, qz) < 1 || dist3(px, py, pz, rx, ry, rz) < 1 || dist3(qx, qy, qz, rx, ry, rz) < 1) { return false; }
  return area2(px, py, pz, qx, qy, qz, rx, ry, rz) >= 1.2;
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
// Смещение точки на прямой от O: не меньше 0,5 по модулю и в пределах поля.
Function place(s, lo, hi) {
  float r = s;
  if (abs(r) < 0.5) { if (r < 0) { r = -0.5; } else { r = 0.5; } }
  return min(max(r, lo + 0.2), hi - 0.2);
}

Start {
  pox = O.pos.x; poy = O.pos.y; poz = O.pos.z;
  pxx = X.pos.x; pxy = X.pos.y; pxz = X.pos.z;
  pyx = Y.pos.x; pyy = Y.pos.y; pyz = Y.pos.z;
}

Update {
  float mO = abs(O.pos.x - pox) + abs(O.pos.y - poy) + abs(O.pos.z - poz);
  float mX = abs(X.pos.x - pxx) + abs(X.pos.y - pxy) + abs(X.pos.z - pxz);
  float mY = abs(Y.pos.x - pyx) + abs(Y.pos.y - pyy) + abs(Y.pos.z - pyz);
  float m = max(mO, mX, mY);
  if (m > 0.000001) {
    if (mO == m) {
      if (okT(O.pos.x, O.pos.y, O.pos.z, pxx, pxy, pxz, pyx, pyy, pyz)) { pox = O.pos.x; poy = O.pos.y; poz = O.pos.z; } else { O.pos.x = pox; O.pos.y = poy; O.pos.z = poz; }
    } else if (mX == m) {
      if (okT(X.pos.x, X.pos.y, X.pos.z, pox, poy, poz, pyx, pyy, pyz)) { pxx = X.pos.x; pxy = X.pos.y; pxz = X.pos.z; } else { X.pos.x = pxx; X.pos.y = pxy; X.pos.z = pxz; }
    } else {
      if (okT(Y.pos.x, Y.pos.y, Y.pos.z, pox, poy, poz, pxx, pxy, pxz)) { pyx = Y.pos.x; pyy = Y.pos.y; pyz = Y.pos.z; } else { Y.pos.x = pyx; Y.pos.y = pyy; Y.pos.z = pyz; }
    }
  }

  // Единичные направления прямых a = OX и b = OY.
  float al = dist3(O.pos.x, O.pos.y, O.pos.z, X.pos.x, X.pos.y, X.pos.z);
  float bl = dist3(O.pos.x, O.pos.y, O.pos.z, Y.pos.x, Y.pos.y, Y.pos.z);
  float ax = (X.pos.x - O.pos.x) / al; float ay = (X.pos.y - O.pos.y) / al; float az = (X.pos.z - O.pos.z) / al;
  float bx = (Y.pos.x - O.pos.x) / bl; float by = (Y.pos.y - O.pos.y) / bl; float bz = (Y.pos.z - O.pos.z) / bl;
  float alo = clipLo(O.pos.x, O.pos.y, O.pos.z, ax, ay, az); float ahi = clipHi(O.pos.x, O.pos.y, O.pos.z, ax, ay, az);
  float blo = clipLo(O.pos.x, O.pos.y, O.pos.z, bx, by, bz); float bhi = clipHi(O.pos.x, O.pos.y, O.pos.z, bx, by, bz);
  A1.pos.x = O.pos.x + ax * alo; A1.pos.y = O.pos.y + ay * alo; A1.pos.z = O.pos.z + az * alo;
  A2.pos.x = O.pos.x + ax * ahi; A2.pos.y = O.pos.y + ay * ahi; A2.pos.z = O.pos.z + az * ahi;
  B1.pos.x = O.pos.x + bx * blo; B1.pos.y = O.pos.y + by * blo; B1.pos.z = O.pos.z + bz * blo;
  B2.pos.x = O.pos.x + bx * bhi; B2.pos.y = O.pos.y + by * bhi; B2.pos.z = O.pos.z + bz * bhi;

  float zt = place(sz, alo, ahi); float wt = place(sw, blo, bhi);
  Z.pos.x = O.pos.x + ax * zt; Z.pos.y = O.pos.y + ay * zt; Z.pos.z = O.pos.z + az * zt;
  W.pos.x = O.pos.x + bx * wt; W.pos.y = O.pos.y + by * wt; W.pos.z = O.pos.z + bz * wt;

  // Единичные нормали плоскостей OXY и OZW (знак выровнен по первой).
  float n1x = ay * bz - az * by; float n1y = az * bx - ax * bz; float n1z = ax * by - ay * bx;
  float n1l = sqrt(n1x * n1x + n1y * n1y + n1z * n1z);
  n1x = n1x / n1l; n1y = n1y / n1l; n1z = n1z / n1l;
  float n2x = (Z.pos.y - O.pos.y) * (W.pos.z - O.pos.z) - (Z.pos.z - O.pos.z) * (W.pos.y - O.pos.y);
  float n2y = (Z.pos.z - O.pos.z) * (W.pos.x - O.pos.x) - (Z.pos.x - O.pos.x) * (W.pos.z - O.pos.z);
  float n2z = (Z.pos.x - O.pos.x) * (W.pos.y - O.pos.y) - (Z.pos.y - O.pos.y) * (W.pos.x - O.pos.x);
  float n2l = sqrt(n2x * n2x + n2y * n2y + n2z * n2z);
  n2x = n2x / n2l; n2y = n2y / n2l; n2z = n2z / n2l;
  if (n1x * n2x + n1y * n2y + n1z * n2z < 0) { n2x = -n2x; n2y = -n2y; n2z = -n2z; }
  float ang = acos(max(-1, min(1, ax * bx + ay * by + az * bz))) * 57.29578;
  if (ang > 90) { ang = 180 - ang; }

  info = "**Следствие 2:** две пересекающиеся прямые a = OX и b = OY (точка пересечения O, угол между ними " + format(ang, 0) + "°) определяют единственную плоскость. Она проходит через три точки O, X, Y, не лежащие на одной прямой, и содержит обе прямые целиком.\n\n**Другие точки — та же плоскость.** Возьмём Z на a и W на b (зелёные): плоскость OZW имеет нормаль (" + num(n2x, 2) + "; " + num(n2y, 2) + "; " + num(n2z, 2) + "), а плоскость OXY — (" + num(n1x, 2) + "; " + num(n1y, 2) + "; " + num(n1z, 2) + "). Нормали совпадают, значит, это одна и та же плоскость при любом выборе Z и W.";
}
]
