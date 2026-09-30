[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 62);
camera start zoom = 1.5;

// Сфера радиуса R = 1 показана радиусом 3. «Прямые» сферы — большие окружности: a через A и B, b через C и D.
draw Surface { name = "sph"; type = parametric; x = "3 * sin(pi * u) * cos(6.283185 * v)"; y = "3 * cos(pi * u)"; z = "3 * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; color = #3b82f6; opacity = 0.08 }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "A"; pos = (2.4, 1.6, 0.9); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (-1.2, 2.2, 1.5); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (0.4, -2.2, 2.0); text = true("C"); pauseOnDrag = false }
new Point3D { name = "D"; pos = (-1.5, -1.0, -2.4); text = true("D"); pauseOnDrag = false }
new Point3D { name = "X"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("X"); active = !anti }
new Point3D { name = "Y"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("X′"); active = !anti }
new Point3D { name = "AA"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A′") }

new Curve3D { name = "ca"; type = parametric; x = "3 * (cos(6.283185 * t) * ax + sin(6.283185 * t) * avx)"; y = "3 * (cos(6.283185 * t) * ay + sin(6.283185 * t) * avy)"; z = "3 * (cos(6.283185 * t) * az + sin(6.283185 * t) * avz)"; segments = 90; thickness = 2.5; color = #f59e0b; active = !anti }
new Curve3D { name = "cb"; type = parametric; x = "3 * (cos(6.283185 * t) * cx + sin(6.283185 * t) * cvx)"; y = "3 * (cos(6.283185 * t) * cy + sin(6.283185 * t) * cvy)"; z = "3 * (cos(6.283185 * t) * cz + sin(6.283185 * t) * cvz)"; segments = 90; thickness = 2.5; color = #3b82f6 }
// Кратчайший путь AB — меньшая дуга большой окружности (сферическая интерполяция).
new Curve3D { name = "arc"; type = parametric; x = "3 * (sin((1 - t) * la) * ax + sin(t * la) * bx) / sin(la)"; y = "3 * (sin((1 - t) * la) * ay + sin(t * la) * by) / sin(la)"; z = "3 * (sin((1 - t) * la) * az + sin(t * la) * bz) / sin(la)"; segments = 60; thickness = 6; color = #f59e0b; active = !anti }
new Curve3D { name = "arc2"; type = parametric; x = "3 * (sin((1 - t) * lc) * cx + sin(t * lc) * dx) / sin(lc)"; y = "3 * (sin((1 - t) * lc) * cy + sin(t * lc) * dy) / sin(lc)"; z = "3 * (sin((1 - t) * lc) * cz + sin(t * lc) * dz) / sin(lc)"; segments = 60; thickness = 6; color = #3b82f6 }
// Для антиподов кратчайших путей бесконечно много: все полуокружности от A до A′.
new Curve3D { name = "m0"; type = parametric; x = "3 * (cos(6.283185 * t) * ax + sin(6.283185 * t) * (1.0 * pux + 0.0 * pvx))"; y = "3 * (cos(6.283185 * t) * ay + sin(6.283185 * t) * (1.0 * puy + 0.0 * pvy))"; z = "3 * (cos(6.283185 * t) * az + sin(6.283185 * t) * (1.0 * puz + 0.0 * pvz))"; segments = 60; thickness = 2; color = #22c55e; active = anti }
new Curve3D { name = "m1"; type = parametric; x = "3 * (cos(6.283185 * t) * ax + sin(6.283185 * t) * (0.86603 * pux + 0.5 * pvx))"; y = "3 * (cos(6.283185 * t) * ay + sin(6.283185 * t) * (0.86603 * puy + 0.5 * pvy))"; z = "3 * (cos(6.283185 * t) * az + sin(6.283185 * t) * (0.86603 * puz + 0.5 * pvz))"; segments = 60; thickness = 2; color = #22c55e; active = anti }
new Curve3D { name = "m2"; type = parametric; x = "3 * (cos(6.283185 * t) * ax + sin(6.283185 * t) * (0.5 * pux + 0.86603 * pvx))"; y = "3 * (cos(6.283185 * t) * ay + sin(6.283185 * t) * (0.5 * puy + 0.86603 * pvy))"; z = "3 * (cos(6.283185 * t) * az + sin(6.283185 * t) * (0.5 * puz + 0.86603 * pvz))"; segments = 60; thickness = 2; color = #22c55e; active = anti }
new Curve3D { name = "m3"; type = parametric; x = "3 * (cos(6.283185 * t) * ax + sin(6.283185 * t) * (0.0 * pux + 1.0 * pvx))"; y = "3 * (cos(6.283185 * t) * ay + sin(6.283185 * t) * (0.0 * puy + 1.0 * pvy))"; z = "3 * (cos(6.283185 * t) * az + sin(6.283185 * t) * (0.0 * puz + 1.0 * pvz))"; segments = 60; thickness = 2; color = #22c55e; active = anti }
new Curve3D { name = "m4"; type = parametric; x = "3 * (cos(6.283185 * t) * ax + sin(6.283185 * t) * (-0.5 * pux + 0.86603 * pvx))"; y = "3 * (cos(6.283185 * t) * ay + sin(6.283185 * t) * (-0.5 * puy + 0.86603 * pvy))"; z = "3 * (cos(6.283185 * t) * az + sin(6.283185 * t) * (-0.5 * puz + 0.86603 * pvz))"; segments = 60; thickness = 2; color = #22c55e; active = anti }
new Curve3D { name = "m5"; type = parametric; x = "3 * (cos(6.283185 * t) * ax + sin(6.283185 * t) * (-0.86603 * pux + 0.5 * pvx))"; y = "3 * (cos(6.283185 * t) * ay + sin(6.283185 * t) * (-0.86603 * puy + 0.5 * pvy))"; z = "3 * (cos(6.283185 * t) * az + sin(6.283185 * t) * (-0.86603 * puz + 0.5 * pvz))"; segments = 60; thickness = 2; color = #22c55e; active = anti }
new UI { name = "tAnti"; type = toggle; label = "B — антипод точки A"; variable = anti; default = false }

string info = "";
bool anti = false;
float pa = 0;
float ax = 0.8; float ay = 0.53; float az = 0.3; float bx = -0.4; float by = 0.73; float bz = 0.5;
float cx = 0.13; float cy = -0.73; float cz = 0.67; float dx = -0.83; float dy = -0.17; float dz = -0.53;
float avx = 0; float avy = 1; float avz = 0; float cvx = 0; float cvy = 1; float cvz = 0;
float pux = 1; float puy = 0; float puz = 0; float pvx = 0; float pvy = 0; float pvz = 1;
float la = 1.5; float lc = 1.5;
float qax = 2.4; float qay = 1.6; float qaz = 0.9; float qbx = -1.2; float qby = 2.2; float qbz = 1.5;
float qcx = 0.4; float qcy = -2.2; float qcz = 2; float qdx = -1.5; float qdy = -1; float qdz = -2.4;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function crx(ax, ay, az, bx, by, bz) { return ay * bz - az * by; }
Function cry(ax, ay, az, bx, by, bz) { return az * bx - ax * bz; }
Function crz(ax, ay, az, bx, by, bz) { return ax * by - ay * bx; }
Function ang(ax, ay, az, bx, by, bz) { return acos(max(-1, min(1, ax * bx + ay * by + az * bz))); }

Update {
  float r1 = sqrt(A.pos.x * A.pos.x + A.pos.y * A.pos.y + A.pos.z * A.pos.z); if (r1 < 0.01) { r1 = 0.01; }
  float r2 = sqrt(B.pos.x * B.pos.x + B.pos.y * B.pos.y + B.pos.z * B.pos.z); if (r2 < 0.01) { r2 = 0.01; }
  float r3 = sqrt(C.pos.x * C.pos.x + C.pos.y * C.pos.y + C.pos.z * C.pos.z); if (r3 < 0.01) { r3 = 0.01; }
  float r4 = sqrt(D.pos.x * D.pos.x + D.pos.y * D.pos.y + D.pos.z * D.pos.z); if (r4 < 0.01) { r4 = 0.01; }
  ax = A.pos.x / r1; ay = A.pos.y / r1; az = A.pos.z / r1;
  bx = B.pos.x / r2; by = B.pos.y / r2; bz = B.pos.z / r2;
  cx = C.pos.x / r3; cy = C.pos.y / r3; cz = C.pos.z / r3;
  dx = D.pos.x / r4; dy = D.pos.y / r4; dz = D.pos.z / r4;
  // Вспомогательный вектор p, перпендикулярный OA (для семейства полуокружностей и для выхода из режима антиподов).
  float hx = 0; float hy = 1; if (abs(ay) > 0.9) { hx = 1; hy = 0; }
  float px = crx(ax, ay, az, hx, hy, 0); float py = cry(ax, ay, az, hx, hy, 0); float pz = crz(ax, ay, az, hx, hy, 0);
  float pl = sqrt(px * px + py * py + pz * pz); pux = px / pl; puy = py / pl; puz = pz / pl;
  pvx = crx(ax, ay, az, pux, puy, puz); pvy = cry(ax, ay, az, pux, puy, puz); pvz = crz(ax, ay, az, pux, puy, puz);
  if (anti) { bx = -ax; by = -ay; bz = -az; }
  if (!anti && pa > 0.5) { bx = -0.894 * ax + 0.447 * pux; by = -0.894 * ay + 0.447 * puy; bz = -0.894 * az + 0.447 * puz; }
  float ok = 1;
  if (abs(cx * dx + cy * dy + cz * dz) > 0.985) { ok = 0; }
  float n1x = crx(ax, ay, az, bx, by, bz); float n1y = cry(ax, ay, az, bx, by, bz); float n1z = crz(ax, ay, az, bx, by, bz);
  float n2x = crx(cx, cy, cz, dx, dy, dz); float n2y = cry(cx, cy, cz, dx, dy, dz); float n2z = crz(cx, cy, cz, dx, dy, dz);
  float l1 = sqrt(n1x * n1x + n1y * n1y + n1z * n1z); float l2 = sqrt(n2x * n2x + n2y * n2y + n2z * n2z);
  if (!anti) {
    if (abs(ax * bx + ay * by + az * bz) > 0.985) { ok = 0; }
    if (ok > 0.5) { if (abs((n1x * n2x + n1y * n2y + n1z * n2z) / (l1 * l2)) > 0.985) { ok = 0; } }
  }
  if (ok < 0.5) {
    // Недопустимый ход: возвращаем последнее корректное положение.
    A.pos.x = qax; A.pos.y = qay; A.pos.z = qaz; B.pos.x = qbx; B.pos.y = qby; B.pos.z = qbz;
    C.pos.x = qcx; C.pos.y = qcy; C.pos.z = qcz; D.pos.x = qdx; D.pos.y = qdy; D.pos.z = qdz;
    ax = qax / 3; ay = qay / 3; az = qaz / 3; bx = qbx / 3; by = qby / 3; bz = qbz / 3;
    cx = qcx / 3; cy = qcy / 3; cz = qcz / 3; dx = qdx / 3; dy = qdy / 3; dz = qdz / 3;
    if (anti) { bx = -ax; by = -ay; bz = -az; B.pos.x = 3 * bx; B.pos.y = 3 * by; B.pos.z = 3 * bz; }
    n1x = crx(ax, ay, az, bx, by, bz); n1y = cry(ax, ay, az, bx, by, bz); n1z = crz(ax, ay, az, bx, by, bz);
    n2x = crx(cx, cy, cz, dx, dy, dz); n2y = cry(cx, cy, cz, dx, dy, dz); n2z = crz(cx, cy, cz, dx, dy, dz);
    l1 = sqrt(n1x * n1x + n1y * n1y + n1z * n1z); l2 = sqrt(n2x * n2x + n2y * n2y + n2z * n2z);
  } else {
    if (abs(r1 - 3) > 0.0001 || abs(r2 - 3) > 0.0001 || abs(r3 - 3) > 0.0001 || abs(r4 - 3) > 0.0001 || anti || pa > 0.5) {
      A.pos.x = 3 * ax; A.pos.y = 3 * ay; A.pos.z = 3 * az; B.pos.x = 3 * bx; B.pos.y = 3 * by; B.pos.z = 3 * bz;
      C.pos.x = 3 * cx; C.pos.y = 3 * cy; C.pos.z = 3 * cz; D.pos.x = 3 * dx; D.pos.y = 3 * dy; D.pos.z = 3 * dz;
    }
    qax = 3 * ax; qay = 3 * ay; qaz = 3 * az; qbx = 3 * bx; qby = 3 * by; qbz = 3 * bz;
    qcx = 3 * cx; qcy = 3 * cy; qcz = 3 * cz; qdx = 3 * dx; qdy = 3 * dy; qdz = 3 * dz;
  }
  pa = 0; if (anti) { pa = 1; }
  AA.pos.x = -3 * ax; AA.pos.y = -3 * ay; AA.pos.z = -3 * az;
  // Базисы больших окружностей a и b: (A, v), (C, w), v ⟂ A.
  float dab = ax * bx + ay * by + az * bz;
  avx = bx - dab * ax; avy = by - dab * ay; avz = bz - dab * az;
  float av = sqrt(avx * avx + avy * avy + avz * avz); if (av < 0.001) { av = 1; } avx = avx / av; avy = avy / av; avz = avz / av;
  float dcd = cx * dx + cy * dy + cz * dz;
  cvx = dx - dcd * cx; cvy = dy - dcd * cy; cvz = dz - dcd * cz;
  float cv = sqrt(cvx * cvx + cvy * cvy + cvz * cvz); if (cv < 0.001) { cv = 1; } cvx = cvx / cv; cvy = cvy / cv; cvz = cvz / cv;
  la = ang(ax, ay, az, bx, by, bz); lc = ang(cx, cy, cz, dx, dy, dz);
  if (la > 3.1) { la = 3.1; }
  // Точки пересечения окружностей a и b — антиподы ±(n1 × n2).
  float ix = crx(n1x, n1y, n1z, n2x, n2y, n2z); float iy = cry(n1x, n1y, n1z, n2x, n2y, n2z); float iz = crz(n1x, n1y, n1z, n2x, n2y, n2z);
  float il = sqrt(ix * ix + iy * iy + iz * iz); if (il < 0.000001) { il = 1; }
  X.pos.x = 3 * ix / il; X.pos.y = 3 * iy / il; X.pos.z = 3 * iz / il;
  Y.pos.x = -X.pos.x; Y.pos.y = -X.pos.y; Y.pos.z = -X.pos.z;
  float phi = degrees(acos(max(-1, min(1, (n1x * n2x + n1y * n2y + n1z * n2z) / (l1 * l2)))));

  info = "**Сферическая геометрия**: роль прямых играют большие окружности. Расстояние между точками — длина меньшей дуги большой окружности, соединяющей их (при R = 1 равна центральному углу в радианах).";
  if (anti) {
    info = info + "\n\nB — **антипод** A: d(A, B) = π R = **" + format(pi, 3) + "** — наибольшее возможное расстояние. Большая окружность через A и B не единственна: кратчайших путей бесконечно много (зелёные полуокружности — часть из них).";
  } else {
    info = info + "\n\nd(A, B) = **" + format(la, 3) + "** R = " + format(degrees(la), 1) + "° ≤ π R (жёлтая дуга); вторая дуга той же окружности длиннее: " + format(2 * pi - la, 3) + " R. Для не антиподов путь единственный.";
  }
  info = info + "\n\nd(C, D) = **" + format(lc, 3) + "** R (синяя дуга).";
  if (!anti) {
    info = info + "\n\nПараллельных нет: окружности a и b всегда пересекаются, причём в двух **антиподах** X и X′ (расстояние между ними π R). Угол между ними — угол между касательными в X, равный двугранному углу между их плоскостями: **" + format(phi, 1) + "°** (смежный — " + format(180 - phi, 1) + "°).";
  }
}
]
