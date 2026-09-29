[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 60);
camera start zoom = 1.35;

// ---- Точка P и прямая a = QR (все три точки свободны). H — основание перпендикуляра PH,
// X — другая точка прямой (ползунок s задаёт HX). Плоскость через P и a — единственная. ----
new Point3D { name = "P"; pos = (-1, 2.5, 1.5); text = true("P"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "Q"; pos = (-3, -2, -1); text = true("Q"); pauseOnDrag = false }
new Point3D { name = "R"; pos = (3, -1, -1.5); text = true("R"); pauseOnDrag = false }
new Point3D { name = "H"; pos = (0, 0, 0); text = true("H"); color = #22c55e; dynamic = false; collision = false }
new Point3D { name = "X"; pos = (0, 0, 0); text = true("X"); color = #3b82f6; dynamic = false; collision = false }
new Point3D { name = "L1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "L2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "ln"; pos = (L1, L2); interact = false; thickness = 3 }
new Line3D { name = "ph"; pos = (P, H); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "px"; pos = (P, X); interact = false; thickness = 2; color = #3b82f6 }
draw Punctir { name = "punPx"; edge = "px" }
draw InfPlane { name = "pl"; points = (P, Q, R); size = 3.2; opacity = 0.14; color = #f59e0b }

new UI { name = "sS"; type = slider; label = "положение X на прямой: HX"; variable = s; min = -4; max = 4; step = 0.05; default = 2 }

string info = "";
float s = 2;
float ppx = 0; float ppy = 0; float ppz = 0;
float pqx = 0; float pqy = 0; float pqz = 0;
float prx = 0; float pry = 0; float prz = 0;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
// Расстояние вдоль луча (m + t·d, t ≥ 0) до границы поля |координата| ≤ h.
Function tb(m, d, h) {
  if (d > 0.000001) { return (h - m) / d; }
  if (d < -0.000001) { return (-h - m) / d; }
  return 1000;
}
Function inF(x, y, z) { return abs(x) <= 4.3 && abs(y) <= 4.3 && abs(z) <= 4.3; }
// Расстояние от P до прямой QR (0 — вырождение) и основание перпендикуляра в поле.
Function ok() {
  if (!inF(P.pos.x, P.pos.y, P.pos.z) || !inF(Q.pos.x, Q.pos.y, Q.pos.z) || !inF(R.pos.x, R.pos.y, R.pos.z)) { return false; }
  float dx = R.pos.x - Q.pos.x; float dy = R.pos.y - Q.pos.y; float dz = R.pos.z - Q.pos.z;
  float l = sqrt(dx * dx + dy * dy + dz * dz);
  if (l < 1.6) { return false; }
  float rx = P.pos.x - Q.pos.x; float ry = P.pos.y - Q.pos.y; float rz = P.pos.z - Q.pos.z;
  float t = (rx * dx + ry * dy + rz * dz) / (l * l);
  float hx = Q.pos.x + t * dx - P.pos.x; float hy = Q.pos.y + t * dy - P.pos.y; float hz = Q.pos.z + t * dz - P.pos.z;
  if (sqrt(hx * hx + hy * hy + hz * hz) < 0.7) { return false; }
  return inF(Q.pos.x + t * dx, Q.pos.y + t * dy, Q.pos.z + t * dz);
}

Start {
  ppx = P.pos.x; ppy = P.pos.y; ppz = P.pos.z; pqx = Q.pos.x; pqy = Q.pos.y; pqz = Q.pos.z;
  prx = R.pos.x; pry = R.pos.y; prz = R.pos.z;
}

Update {
  if (ok()) {
    ppx = P.pos.x; ppy = P.pos.y; ppz = P.pos.z; pqx = Q.pos.x; pqy = Q.pos.y; pqz = Q.pos.z;
    prx = R.pos.x; pry = R.pos.y; prz = R.pos.z;
  } else {
    P.pos.x = ppx; P.pos.y = ppy; P.pos.z = ppz; Q.pos.x = pqx; Q.pos.y = pqy; Q.pos.z = pqz;
    R.pos.x = prx; R.pos.y = pry; R.pos.z = prz;
  }
  float dx = R.pos.x - Q.pos.x; float dy = R.pos.y - Q.pos.y; float dz = R.pos.z - Q.pos.z;
  float l = sqrt(dx * dx + dy * dy + dz * dz);
  float ux = dx / l; float uy = dy / l; float uz = dz / l;
  float rx = P.pos.x - Q.pos.x; float ry = P.pos.y - Q.pos.y; float rz = P.pos.z - Q.pos.z;
  float t = rx * ux + ry * uy + rz * uz;
  H.pos.x = Q.pos.x + t * ux; H.pos.y = Q.pos.y + t * uy; H.pos.z = Q.pos.z + t * uz;
  float cx = ry * dz - rz * dy; float cy = rz * dx - rx * dz; float cz = rx * dy - ry * dx;
  float cl = sqrt(cx * cx + cy * cy + cz * cz);
  float d = cl / l;
  float d2 = sqrt((P.pos.x - H.pos.x) * (P.pos.x - H.pos.x) + (P.pos.y - H.pos.y) * (P.pos.y - H.pos.y) + (P.pos.z - H.pos.z) * (P.pos.z - H.pos.z));
  float m1 = min(tb(H.pos.x, -ux, 4.3), tb(H.pos.y, -uy, 4.3), tb(H.pos.z, -uz, 4.3));
  float m2 = min(tb(H.pos.x, ux, 4.3), tb(H.pos.y, uy, 4.3), tb(H.pos.z, uz, 4.3));
  L1.pos.x = H.pos.x - ux * m1; L1.pos.y = H.pos.y - uy * m1; L1.pos.z = H.pos.z - uz * m1;
  L2.pos.x = H.pos.x + ux * m2; L2.pos.y = H.pos.y + uy * m2; L2.pos.z = H.pos.z + uz * m2;
  float se = max(-m1, min(m2, s));
  X.pos.x = H.pos.x + se * ux; X.pos.y = H.pos.y + se * uy; X.pos.z = H.pos.z + se * uz;
  float px = sqrt(d * d + se * se);

  info = "**Расстояние от точки P до прямой a = QR** — длина перпендикуляра PH, опущенного из P на a. Точка вне прямой и сама прямая лежат в единственной плоскости (жёлтая), а в ней перпендикуляр из точки на прямую единствен.\n\n";
  info = info + "QP = (" + num(rx, 1) + "; " + num(ry, 1) + "; " + num(rz, 1) + "), QR = (" + num(dx, 1) + "; " + num(dy, 1) + "; " + num(dz, 1) + "): PH = |QP × QR| / |QR| = " + num(cl, 2) + " / " + num(l, 2) + " = **" + num(d, 2) + "**. Проверка по координатам H: PH = " + num(d2, 2) + ".\n\n";
  if (abs(se) < 0.05) {
    info = info + "**Минимальность.** X совпала с H: PX = PH = " + num(d, 2) + " — меньше не бывает.";
  } else {
    info = info + "**Минимальность.** Для другой точки X прямой в прямоугольном треугольнике PHX отрезок PX — гипотенуза, HX = " + num(abs(se), 2) + ": PX = √(" + num(d, 2) + "² + " + num(abs(se), 2) + "²) = " + num(px, 2) + " > PH = " + num(d, 2) + ".";
  }
}
]
