[
description = "{info}"

field width = 10; field height = 8; field depth = 10;
show grid = false; show axes = false;
camera start rot = (40, 60);
camera start zoom = 1.1;

// ---- Прямая AB и прямая CD — все четыре точки свободно перетаскиваются в пределах
// поля. Каждый кадр вычисляется взаимное расположение: пересекаются / параллельны /
// скрещиваются. В скрещивающемся случае показывается их общий перпендикуляр PQ. ----
new Point3D { name = "A"; pos = (-3, 0, -2); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (3, 0, -2); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (0, -3, 2); text = true("C"); pauseOnDrag = false }
new Point3D { name = "D"; pos = (0, 3, 2); text = true("D"); pauseOnDrag = false }
new Line3D { name = "ab"; pos = (A, B) }
new Line3D { name = "cd"; pos = (C, D) }

new Point3D { name = "P"; pos = (0, 0, 0); dynamic = false; collision = false; color = #f59e0b; active = skew }
new Point3D { name = "Q"; pos = (0, 0, 0); dynamic = false; collision = false; color = #f59e0b; active = skew }
new Line3D { name = "pq"; pos = (P, Q); interact = false; active = skew }
draw Punctir { name = "punPq"; edge = "pq" }
new Point3D { name = "E1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "E2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
draw InfPlane { name = "alpha"; points = (A, B, E1); size = 2.2; opacity = 0.18; color = #3b82f6; active = skew }
draw InfPlane { name = "beta"; points = (C, D, E2); size = 2.2; opacity = 0.18; color = #f59e0b; active = skew }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;
float pdx = 0; float pdy = 0; float pdz = 0;
float hx = 4.3; float hy = 3.3; float hz = 4.3;
float skew = 0; float parallel = 0; float dist = 0; float ang = 0;

Function inField3(x, y, z) { return abs(x) <= hx && abs(y) <= hy && abs(z) <= hz; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; pdx = D.pos.x; pdy = D.pos.y; pdz = D.pos.z;
}

Update {
  if (inField3(A.pos.x, A.pos.y, A.pos.z)) { pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; } else { A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; }
  if (inField3(B.pos.x, B.pos.y, B.pos.z)) { pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z; } else { B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz; }
  if (inField3(C.pos.x, C.pos.y, C.pos.z)) { pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; } else { C.pos.x = pcx; C.pos.y = pcy; C.pos.z = pcz; }
  if (inField3(D.pos.x, D.pos.y, D.pos.z)) { pdx = D.pos.x; pdy = D.pos.y; pdz = D.pos.z; } else { D.pos.x = pdx; D.pos.y = pdy; D.pos.z = pdz; }

  float d1x = B.pos.x - A.pos.x; float d1y = B.pos.y - A.pos.y; float d1z = B.pos.z - A.pos.z;
  float d2x = D.pos.x - C.pos.x; float d2y = D.pos.y - C.pos.y; float d2z = D.pos.z - C.pos.z;
  float rx = A.pos.x - C.pos.x; float ry = A.pos.y - C.pos.y; float rz = A.pos.z - C.pos.z;
  // Векторное произведение направляющих — его длина нулевая только у параллельных прямых.
  float ncx = d1y * d2z - d1z * d2y; float ncy = d1z * d2x - d1x * d2z; float ncz = d1x * d2y - d1y * d2x;
  float nlen = sqrt(ncx * ncx + ncy * ncy + ncz * ncz);
  float d1len = sqrt(d1x * d1x + d1y * d1y + d1z * d1z);
  float d2len = sqrt(d2x * d2x + d2y * d2y + d2z * d2z);
  float dotd = d1x * d2x + d1y * d2y + d1z * d2z;
  ang = acos(max(-1, min(1, abs(dotd) / (d1len * d2len)))) * 180 / pi;

  parallel = 0; skew = 0; dist = 0;
  if (nlen < 0.02 * d1len * d2len) {
    // Направляющие коллинеарны: прямые параллельны (или совпадают — считаем тем же случаем).
    parallel = 1;
    float crx = ry * d1z - rz * d1y; float cry = rz * d1x - rx * d1z; float crz = rx * d1y - ry * d1x;
    dist = sqrt(crx * crx + cry * cry + crz * crz) / d1len;
  } else {
    // Смешанное произведение (r, d1, d2): равно нулю у прямых, лежащих в одной плоскости
    // (пересекающихся), не равно нулю — у скрещивающихся.
    float mixed = rx * ncx + ry * ncy + rz * ncz;
    if (abs(mixed) < 0.05 * nlen) {
      skew = 0;
    } else {
      skew = 1;
      dist = abs(mixed) / nlen;
      // Ближайшие точки на прямых (P на AB, Q на CD) — основания общего перпендикуляра.
      float a = d1x * d1x + d1y * d1y + d1z * d1z; float b = d1x * d2x + d1y * d2y + d1z * d2z; float c = d2x * d2x + d2y * d2y + d2z * d2z;
      float e = d1x * rx + d1y * ry + d1z * rz; float f = d2x * rx + d2y * ry + d2z * rz;
      float denom = a * c - b * b;
      float t = (b * f - c * e) / denom; float s = (a * f - b * e) / denom;
      E1.pos.x = A.pos.x + d2x; E1.pos.y = A.pos.y + d2y; E1.pos.z = A.pos.z + d2z;
      E2.pos.x = C.pos.x + d1x; E2.pos.y = C.pos.y + d1y; E2.pos.z = C.pos.z + d1z;
      P.pos.x = A.pos.x + d1x * t; P.pos.y = A.pos.y + d1y * t; P.pos.z = A.pos.z + d1z * t;
      Q.pos.x = C.pos.x + d2x * s; Q.pos.y = C.pos.y + d2y * s; Q.pos.z = C.pos.z + d2z * s;
    }
  }

  info = "**Скрещивающиеся прямые** — прямые в пространстве, не лежащие в одной плоскости: у них нет ни общих точек, ни параллельности.\n\n";
  if (skew > 0.5) {
    info = info + "Сейчас AB и CD **скрещиваются**. Общий перпендикуляр PQ = " + num(dist, 2) + " — кратчайшее расстояние между прямыми, оно не зависит от выбора точек на них. Плоскость через AB, параллельная CD (синяя), и плоскость через CD, параллельная AB (жёлтая), параллельны друг другу. Угол между направляющими векторами — " + num(ang, 0) + "°.";
  } else if (parallel > 0.5) {
    info = info + "Сейчас AB ∥ CD — направляющие векторы коллинеарны, это не скрещивание, а параллельность (расстояние между прямыми " + num(dist, 2) + "). Сдвиньте C или D, чтобы прямые вышли из этого положения.";
  } else {
    info = info + "Сейчас AB и CD **пересекаются** — они лежат в одной плоскости и имеют общую точку, это не скрещивание. Сдвиньте одну из точек, чтобы прямые разошлись по разным плоскостям.";
  }
}
]
