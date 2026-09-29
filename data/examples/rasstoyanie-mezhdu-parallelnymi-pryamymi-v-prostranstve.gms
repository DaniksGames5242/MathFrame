[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 60);
camera start zoom = 1.35;

// ---- Прямая a = AB и параллельная ей прямая b через M (направление берётся у AB).
// HM — перпендикуляр из M на a; X — точка a (ползунок), X' = X + HM — её основание на b:
// XX' — другой общий перпендикуляр, HXX'M — прямоугольник. ----
new Point3D { name = "A"; pos = (-3, -2.5, -1); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (3, -1, -1.5); text = true("B"); pauseOnDrag = false }
new Point3D { name = "M"; pos = (-1, 2, 1.5); text = true("M"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "H"; pos = (0, 0, 0); text = true("H"); color = #22c55e; dynamic = false; collision = false }
new Point3D { name = "X"; pos = (0, 0, 0); text = true("X"); color = #3b82f6; dynamic = false; collision = false }
new Point3D { name = "Y"; pos = (0, 0, 0); text = true("X'"); color = #3b82f6; dynamic = false; collision = false }
new Point3D { name = "L1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "L2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "N1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "N2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "la"; pos = (L1, L2); interact = false; thickness = 3 }
new Line3D { name = "lb"; pos = (N1, N2); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "hm"; pos = (H, M); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "xy"; pos = (X, Y); interact = false; thickness = 2; color = #3b82f6 }
draw InfPlane { name = "pl"; points = (A, B, M); size = 3.2; opacity = 0.14; color = #f59e0b }

new UI { name = "sS"; type = slider; label = "положение X на прямой a: HX"; variable = s; min = -4; max = 4; step = 0.05; default = 2 }

string info = "";
float s = 2;
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pmx = 0; float pmy = 0; float pmz = 0;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function tb(m, d, h) {
  if (d > 0.000001) { return (h - m) / d; }
  if (d < -0.000001) { return (-h - m) / d; }
  return 1000;
}
Function inF(x, y, z) { return abs(x) <= 4.3 && abs(y) <= 4.3 && abs(z) <= 4.3; }
// Допустимо: A ≠ B, прямые различны (M не на a), основание H перпендикуляра в поле.
Function ok() {
  if (!inF(A.pos.x, A.pos.y, A.pos.z) || !inF(B.pos.x, B.pos.y, B.pos.z) || !inF(M.pos.x, M.pos.y, M.pos.z)) { return false; }
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; float dz = B.pos.z - A.pos.z;
  float l = sqrt(dx * dx + dy * dy + dz * dz);
  if (l < 1.6) { return false; }
  float rx = M.pos.x - A.pos.x; float ry = M.pos.y - A.pos.y; float rz = M.pos.z - A.pos.z;
  float t = (rx * dx + ry * dy + rz * dz) / (l * l);
  float hx = A.pos.x + t * dx - M.pos.x; float hy = A.pos.y + t * dy - M.pos.y; float hz = A.pos.z + t * dz - M.pos.z;
  if (sqrt(hx * hx + hy * hy + hz * hz) < 0.7) { return false; }
  return inF(A.pos.x + t * dx, A.pos.y + t * dy, A.pos.z + t * dz);
}

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z;
}

Update {
  if (ok()) {
    pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
    pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z;
  } else {
    A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz;
    M.pos.x = pmx; M.pos.y = pmy; M.pos.z = pmz;
  }
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; float dz = B.pos.z - A.pos.z;
  float l = sqrt(dx * dx + dy * dy + dz * dz);
  float ux = dx / l; float uy = dy / l; float uz = dz / l;
  float rx = M.pos.x - A.pos.x; float ry = M.pos.y - A.pos.y; float rz = M.pos.z - A.pos.z;
  float t = rx * ux + ry * uy + rz * uz;
  H.pos.x = A.pos.x + t * ux; H.pos.y = A.pos.y + t * uy; H.pos.z = A.pos.z + t * uz;
  float cx = ry * dz - rz * dy; float cy = rz * dx - rx * dz; float cz = rx * dy - ry * dx;
  float d = sqrt(cx * cx + cy * cy + cz * cz) / l;
  float wx = M.pos.x - H.pos.x; float wy = M.pos.y - H.pos.y; float wz = M.pos.z - H.pos.z;
  float a1 = min(tb(H.pos.x, -ux, 4.3), tb(H.pos.y, -uy, 4.3), tb(H.pos.z, -uz, 4.3));
  float a2 = min(tb(H.pos.x, ux, 4.3), tb(H.pos.y, uy, 4.3), tb(H.pos.z, uz, 4.3));
  float b1 = min(tb(M.pos.x, -ux, 4.3), tb(M.pos.y, -uy, 4.3), tb(M.pos.z, -uz, 4.3));
  float b2 = min(tb(M.pos.x, ux, 4.3), tb(M.pos.y, uy, 4.3), tb(M.pos.z, uz, 4.3));
  L1.pos.x = H.pos.x - ux * a1; L1.pos.y = H.pos.y - uy * a1; L1.pos.z = H.pos.z - uz * a1;
  L2.pos.x = H.pos.x + ux * a2; L2.pos.y = H.pos.y + uy * a2; L2.pos.z = H.pos.z + uz * a2;
  N1.pos.x = M.pos.x - ux * b1; N1.pos.y = M.pos.y - uy * b1; N1.pos.z = M.pos.z - uz * b1;
  N2.pos.x = M.pos.x + ux * b2; N2.pos.y = M.pos.y + uy * b2; N2.pos.z = M.pos.z + uz * b2;
  float se = max(-min(a1, b1), min(min(a2, b2), s));
  X.pos.x = H.pos.x + se * ux; X.pos.y = H.pos.y + se * uy; X.pos.z = H.pos.z + se * uz;
  Y.pos.x = X.pos.x + wx; Y.pos.y = X.pos.y + wy; Y.pos.z = X.pos.z + wz;
  float ex = Y.pos.x - X.pos.x; float ey = Y.pos.y - X.pos.y; float ez = Y.pos.z - X.pos.z;
  float xy = sqrt(ex * ex + ey * ey + ez * ez);
  float dot = ex * ux + ey * uy + ez * uz;

  info = "**Расстояние между параллельными прямыми a = AB и b** (b ∥ a, проходит через M) — длина их общего перпендикуляра. Параллельные прямые лежат в одной плоскости (жёлтая), поэтому задача планиметрическая.\n\n";
  info = info + "AM = (" + num(rx, 1) + "; " + num(ry, 1) + "; " + num(rz, 1) + "), s = AB = (" + num(dx, 1) + "; " + num(dy, 1) + "; " + num(dz, 1) + "): d = |AM × s| / |s| = **" + num(d, 2) + "** — это перпендикуляр HM из точки M на прямую a.\n\n";
  if (abs(se) < 0.05) {
    info = info + "**Все общие перпендикуляры равны.** X совпала с H: XX' — это сам HM, XX' = " + num(xy, 2) + ".";
  } else {
    info = info + "**Все общие перпендикуляры равны.** Отрезок XX' с концами на a и b перпендикулярен обеим (XX' · s = " + num(dot, 2) + "); HXX'M — прямоугольник (HX = MX' = " + num(abs(se), 2) + "), поэтому XX' = HM = " + num(xy, 2) + ".";
  }
}
]
