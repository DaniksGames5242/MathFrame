[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 60);
camera start zoom = 1.1;

// ---- Прямые AB и CD (все четыре точки свободны). Признак: смешанное произведение
// [AC, AB, CD] ≠ 0 ⇔ прямые не компланарны ⇔ скрещиваются. Третий признак: через AB
// проходит плоскость α ∥ CD (строится по точкам A, B и E = A + CD); расстояние от C до α
// — это и есть расстояние между прямыми. ----
new Point3D { name = "A"; pos = (-3, -1, -2); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (3, 1, -2); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (-1, -3, 2); text = true("C"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "D"; pos = (1, 3, 1); text = true("D"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "E"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "F"; pos = (0, 0, 0); dynamic = false; collision = false; radius = 0.08; active = showF }
new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "cd"; pos = (C, D); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "cf"; pos = (C, F); interact = false; active = showF }
draw Punctir { name = "punCf"; edge = "cf" }
draw InfPlane { name = "alpha"; points = (A, B, E); size = 2.6; opacity = 0.2; color = #3b82f6; active = showP }

string info = "";
float showF = 0; float showP = 0;
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;
float pdx = 0; float pdy = 0; float pdz = 0;

Function cl4(v) { if (v > 4.3) { return 4.3; } if (v < -4.3) { return -4.3; } return v; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function ok() {
  float ax = B.pos.x - A.pos.x; float ay = B.pos.y - A.pos.y; float az = B.pos.z - A.pos.z;
  float cx = D.pos.x - C.pos.x; float cy = D.pos.y - C.pos.y; float cz = D.pos.z - C.pos.z;
  return ax * ax + ay * ay + az * az >= 2.25 && cx * cx + cy * cy + cz * cz >= 2.25;
}

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; pdx = D.pos.x; pdy = D.pos.y; pdz = D.pos.z;
}

Update {
  // Точки не выходят за поле (движок в 3D их не удерживает): лишнее срезается по осям.
  if (abs(A.pos.x) > 4.3 || abs(A.pos.y) > 4.3 || abs(A.pos.z) > 4.3) { A.pos.x = cl4(A.pos.x); A.pos.y = cl4(A.pos.y); A.pos.z = cl4(A.pos.z); }
  if (abs(B.pos.x) > 4.3 || abs(B.pos.y) > 4.3 || abs(B.pos.z) > 4.3) { B.pos.x = cl4(B.pos.x); B.pos.y = cl4(B.pos.y); B.pos.z = cl4(B.pos.z); }
  if (abs(C.pos.x) > 4.3 || abs(C.pos.y) > 4.3 || abs(C.pos.z) > 4.3) { C.pos.x = cl4(C.pos.x); C.pos.y = cl4(C.pos.y); C.pos.z = cl4(C.pos.z); }
  if (abs(D.pos.x) > 4.3 || abs(D.pos.y) > 4.3 || abs(D.pos.z) > 4.3) { D.pos.x = cl4(D.pos.x); D.pos.y = cl4(D.pos.y); D.pos.z = cl4(D.pos.z); }
  if (ok()) {
    pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
    pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; pdx = D.pos.x; pdy = D.pos.y; pdz = D.pos.z;
  } else {
    A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz;
    C.pos.x = pcx; C.pos.y = pcy; C.pos.z = pcz; D.pos.x = pdx; D.pos.y = pdy; D.pos.z = pdz;
  }
  float d1x = B.pos.x - A.pos.x; float d1y = B.pos.y - A.pos.y; float d1z = B.pos.z - A.pos.z;
  float d2x = D.pos.x - C.pos.x; float d2y = D.pos.y - C.pos.y; float d2z = D.pos.z - C.pos.z;
  float rx = C.pos.x - A.pos.x; float ry = C.pos.y - A.pos.y; float rz = C.pos.z - A.pos.z;
  float nx = d1y * d2z - d1z * d2y; float ny = d1z * d2x - d1x * d2z; float nz = d1x * d2y - d1y * d2x;
  float nl = sqrt(nx * nx + ny * ny + nz * nz);
  float l1 = sqrt(d1x * d1x + d1y * d1y + d1z * d1z); float l2 = sqrt(d2x * d2x + d2y * d2y + d2z * d2z);
  float mixed = rx * nx + ry * ny + rz * nz;
  float par = 0; if (nl < 0.02 * l1 * l2) { par = 1; }
  float dist = 0; if (par < 0.5) { dist = abs(mixed) / nl; } else { dist = sqrt((ry * d1z - rz * d1y) * (ry * d1z - rz * d1y) + (rz * d1x - rx * d1z) * (rz * d1x - rx * d1z) + (rx * d1y - ry * d1x) * (rx * d1y - ry * d1x)) / l1; }
  float skew = 0; if (par < 0.5 && dist > 0.15) { skew = 1; }

  showP = 0; showF = 0;
  if (par < 0.5) {
    showP = 1;
    E.pos.x = A.pos.x + d2x; E.pos.y = A.pos.y + d2y; E.pos.z = A.pos.z + d2z;
    F.pos.x = C.pos.x - mixed * nx / (nl * nl); F.pos.y = C.pos.y - mixed * ny / (nl * nl); F.pos.z = C.pos.z - mixed * nz / (nl * nl);
    if (abs(F.pos.x) < 4.3 && abs(F.pos.y) < 4.3 && abs(F.pos.z) < 4.3 && dist > 0.15) { showF = 1; }
  }

  info = "**Признак скрещивающихся прямых.** Прямые AB и CD скрещиваются, если они не компланарны: смешанное произведение [AC, AB, CD] ≠ 0. Тогда они не пересекаются и не параллельны — и то и другое означало бы, что прямые лежат в одной плоскости.\n\n";
  info = info + "Сейчас AC = (" + num(rx, 1) + "; " + num(ry, 1) + "; " + num(rz, 1) + "), AB = (" + num(d1x, 1) + "; " + num(d1y, 1) + "; " + num(d1z, 1) + "), CD = (" + num(d2x, 1) + "; " + num(d2y, 1) + "; " + num(d2z, 1) + "), [AC, AB, CD] = " + num(mixed, 2) + ".\n\n";
  if (skew > 0.5) {
    info = info + "Определитель не равен нулю — **AB и CD скрещиваются**. Плоскость α через AB, параллельная CD (синяя), не пересекает CD; расстояние от C до α (пунктир) — " + num(dist, 2) + " — это расстояние между прямыми.";
  } else if (par > 0.5) {
    info = info + "Направляющие векторы коллинеарны: **AB ∥ CD**, прямые лежат в одной плоскости — признак не выполнен, прямые не скрещиваются.";
  } else {
    info = info + "Определитель равен нулю: векторы AC, AB, CD компланарны, **AB и CD пересекаются** (лежат в одной плоскости) — признак не выполнен, скрещивания нет.";
  }
}
]
