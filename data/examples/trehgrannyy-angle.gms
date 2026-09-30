[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 60);
camera start zoom = 1.5;

// Единичная сфера показана радиусом 3. Рёбра трёхгранного угла — лучи OA, OB, OC; точки A, B, C перетаскиваются по сфере.
draw Surface { name = "sph"; type = parametric; x = "3 * sin(pi * u) * cos(6.283185 * v)"; y = "3 * cos(pi * u)"; z = "3 * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; color = #3b82f6; opacity = 0.08 }
draw InfPlane { name = "fa"; points = (O, B, C); size = 3.2; opacity = 0.10; color = #22c55e }
draw InfPlane { name = "fb"; points = (O, C, A); size = 3.2; opacity = 0.10; color = #22c55e }
draw InfPlane { name = "fc"; points = (O, A, B); size = 3.2; opacity = 0.10; color = #22c55e }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "A"; pos = (2.85, -0.5, 0.5); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (0.5, 2.85, -0.5); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (-0.5, 0.5, 2.85); text = true("C"); pauseOnDrag = false }

// Стороны — дуги больших окружностей (сферическая интерполяция между вершинами).
new Curve3D { name = "sideA"; type = parametric; x = "3 * (sin((1 - t) * la) * vx + sin(t * la) * wx) / sin(la)"; y = "3 * (sin((1 - t) * la) * vy + sin(t * la) * wy) / sin(la)"; z = "3 * (sin((1 - t) * la) * vz + sin(t * la) * wz) / sin(la)"; segments = 60; thickness = 5; color = #f59e0b }
new Curve3D { name = "sideB"; type = parametric; x = "3 * (sin((1 - t) * lb) * wx + sin(t * lb) * ux) / sin(lb)"; y = "3 * (sin((1 - t) * lb) * wy + sin(t * lb) * uy) / sin(lb)"; z = "3 * (sin((1 - t) * lb) * wz + sin(t * lb) * uz) / sin(lb)"; segments = 60; thickness = 5; color = #f59e0b }
new Curve3D { name = "sideC"; type = parametric; x = "3 * (sin((1 - t) * lc) * ux + sin(t * lc) * vx) / sin(lc)"; y = "3 * (sin((1 - t) * lc) * uy + sin(t * lc) * vy) / sin(lc)"; z = "3 * (sin((1 - t) * lc) * uz + sin(t * lc) * vz) / sin(lc)"; segments = 60; thickness = 5; color = #f59e0b }
new Line3D { name = "oa"; pos = (O, A); interact = false; thickness = 4; color = #3b82f6 }
new Line3D { name = "ob"; pos = (O, B); interact = false; thickness = 4; color = #3b82f6 }
new Line3D { name = "oc"; pos = (O, C); interact = false; thickness = 4; color = #3b82f6 }

// Полярный треугольник A'B'C': вершины — полюсы сторон.
new Point3D { name = "PA"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A'"); color = #f59e0b; active = pol }
new Point3D { name = "PB"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B'"); color = #f59e0b; active = pol }
new Point3D { name = "PC"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("C'"); color = #f59e0b; active = pol }

new Line3D { name = "pa"; pos = (O, PA); interact = false; thickness = 3; color = #f59e0b; active = pol }
new Line3D { name = "pb"; pos = (O, PB); interact = false; thickness = 3; color = #f59e0b; active = pol }
new Line3D { name = "pc"; pos = (O, PC); interact = false; thickness = 3; color = #f59e0b; active = pol }
new UI { name = "tPol"; type = toggle; label = "взаимный трёхгранный угол"; variable = pol; default = false }

// ---- Логика ----
string info = "";
bool pol = false;
float ux = 0.95; float uy = -0.17; float uz = 0.17;
float vx = 0.17; float vy = 0.95; float vz = -0.17;
float wx = -0.17; float wy = 0.17; float wz = 0.95;
float la = 1.2; float lb = 1.2; float lc = 1.2;
float pax = 1; float pay = 0; float paz = 0; float pbx = 0; float pby = 1; float pbz = 0; float pcx = 0; float pcy = 0; float pcz = 1;
float lpa = 1.5; float lpb = 1.5; float lpc = 1.5;
float qax = 2.85; float qay = -0.5; float qaz = 0.5; float qbx = 0.5; float qby = 2.85; float qbz = -0.5; float qcx = -0.5; float qcy = 0.5; float qcz = 2.85;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function ang(ax, ay, az, bx, by, bz) { return acos(max(-1, min(1, ax * bx + ay * by + az * bz))); }
// Допустимое положение: вершины не сливаются, не антиподы и не лежат на одной большой окружности.
Function okT(ax, ay, az, bx, by, bz, cx, cy, cz) {
  float k = 0.985;
  float d1 = ax * bx + ay * by + az * bz;
  float d2 = bx * cx + by * cy + bz * cz;
  float d3 = cx * ax + cy * ay + cz * az;
  if (abs(d1) > k) { return 0; }
  if (abs(d2) > k) { return 0; }
  if (abs(d3) > k) { return 0; }
  float det = ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx);
  if (abs(det) < 0.12) { return 0; }
  return 1;
}

Update {
  // На сферу: длины радиус-векторов приводятся к 3.
  float ra = sqrt(A.pos.x * A.pos.x + A.pos.y * A.pos.y + A.pos.z * A.pos.z);
  float rb = sqrt(B.pos.x * B.pos.x + B.pos.y * B.pos.y + B.pos.z * B.pos.z);
  float rc = sqrt(C.pos.x * C.pos.x + C.pos.y * C.pos.y + C.pos.z * C.pos.z);
  if (ra < 0.01) { ra = 0.01; } if (rb < 0.01) { rb = 0.01; } if (rc < 0.01) { rc = 0.01; }
  float nax = A.pos.x / ra; float nay = A.pos.y / ra; float naz = A.pos.z / ra;
  float nbx = B.pos.x / rb; float nby = B.pos.y / rb; float nbz = B.pos.z / rb;
  float ncx = C.pos.x / rc; float ncy = C.pos.y / rc; float ncz = C.pos.z / rc;
  float good = okT(nax, nay, naz, nbx, nby, nbz, ncx, ncy, ncz);
  if (good < 0.5) {
    // Недопустимый ход отменяется: возвращаем последнее корректное положение.
    A.pos.x = qax; A.pos.y = qay; A.pos.z = qaz;
    B.pos.x = qbx; B.pos.y = qby; B.pos.z = qbz;
    C.pos.x = qcx; C.pos.y = qcy; C.pos.z = qcz;
    nax = qax / 3; nay = qay / 3; naz = qaz / 3;
    nbx = qbx / 3; nby = qby / 3; nbz = qbz / 3;
    ncx = qcx / 3; ncy = qcy / 3; ncz = qcz / 3;
  } else {
    if (abs(ra - 3) > 0.0001 || abs(rb - 3) > 0.0001 || abs(rc - 3) > 0.0001) {
      A.pos.x = 3 * nax; A.pos.y = 3 * nay; A.pos.z = 3 * naz;
      B.pos.x = 3 * nbx; B.pos.y = 3 * nby; B.pos.z = 3 * nbz;
      C.pos.x = 3 * ncx; C.pos.y = 3 * ncy; C.pos.z = 3 * ncz;
    }
    qax = 3 * nax; qay = 3 * nay; qaz = 3 * naz;
    qbx = 3 * nbx; qby = 3 * nby; qbz = 3 * nbz;
    qcx = 3 * ncx; qcy = 3 * ncy; qcz = 3 * ncz;
  }
  ux = nax; uy = nay; uz = naz; vx = nbx; vy = nby; vz = nbz; wx = ncx; wy = ncy; wz = ncz;
  // Стороны (центральные углы) и углы треугольника (косинусная теорема для сторон).
  la = ang(vx, vy, vz, wx, wy, wz); lb = ang(wx, wy, wz, ux, uy, uz); lc = ang(ux, uy, uz, vx, vy, vz);
  float aA = acos(max(-1, min(1, (cos(la) - cos(lb) * cos(lc)) / (sin(lb) * sin(lc)))));
  float aB = acos(max(-1, min(1, (cos(lb) - cos(lc) * cos(la)) / (sin(lc) * sin(la)))));
  float aC = acos(max(-1, min(1, (cos(lc) - cos(la) * cos(lb)) / (sin(la) * sin(lb)))));
  float sumA = degrees(aA + aB + aC);
  float exc = aA + aB + aC - pi;
  // Полярный треугольник: вершина A' — полюс стороны BC, лежащий по ту же сторону от неё, что и A.
  float cxx = vy * wz - vz * wy; float cxy = vz * wx - vx * wz; float cxz = vx * wy - vy * wx;
  float ln = sqrt(cxx * cxx + cxy * cxy + cxz * cxz);
  if (cxx * ux + cxy * uy + cxz * uz < 0) { ln = -ln; }
  pax = cxx / ln; pay = cxy / ln; paz = cxz / ln;
  cxx = wy * uz - wz * uy; cxy = wz * ux - wx * uz; cxz = wx * uy - wy * ux;
  ln = sqrt(cxx * cxx + cxy * cxy + cxz * cxz);
  if (cxx * vx + cxy * vy + cxz * vz < 0) { ln = -ln; }
  pbx = cxx / ln; pby = cxy / ln; pbz = cxz / ln;
  cxx = uy * vz - uz * vy; cxy = uz * vx - ux * vz; cxz = ux * vy - uy * vx;
  ln = sqrt(cxx * cxx + cxy * cxy + cxz * cxz);
  if (cxx * wx + cxy * wy + cxz * wz < 0) { ln = -ln; }
  pcx = cxx / ln; pcy = cxy / ln; pcz = cxz / ln;
  lpa = ang(pbx, pby, pbz, pcx, pcy, pcz); lpb = ang(pcx, pcy, pcz, pax, pay, paz); lpc = ang(pax, pay, paz, pbx, pby, pbz);
  PA.pos.x = 3 * pax; PA.pos.y = 3 * pay; PA.pos.z = 3 * paz;
  PB.pos.x = 3 * pbx; PB.pos.y = 3 * pby; PB.pos.z = 3 * pbz;
  PC.pos.x = 3 * pcx; PC.pos.y = 3 * pcy; PC.pos.z = 3 * pcz;

  float sp = la + lb + lc;
  info = "**Трёхгранный угол OABC**: три плоскости с общей точкой O, рёбра OA, OB, OC. Плоские углы: a = ∠BOC = **" + format(degrees(la), 1) + "°**, b = ∠COA = **" + format(degrees(lb), 1) + "°**, c = ∠AOB = **" + format(degrees(lc), 1) + "°**. Каждый меньше суммы двух других и больше их разности (|b − c| = " + format(degrees(abs(lb - lc)), 1) + "° < a < b + c = " + format(degrees(lb + lc), 1) + "°), а сумма a + b + c = " + format(degrees(sp), 1) + "° < 360°.";
  info = info + "\n\nДвугранные углы при рёбрах OA, OB, OC: α = **" + format(degrees(aA), 1) + "°**, β = **" + format(degrees(aB), 1) + "°**, γ = **" + format(degrees(aC), 1) + "°**. Сечение единичной сферой — сферический треугольник со сторонами a, b, c и углами α, β, γ; его площадь E = α + β + γ − π = **" + format(exc, 3) + "**, угловой дефект вершины δ = 360° − (a + b + c) = **" + format(degrees(2 * pi - sp), 1) + "°**.";
  info = info + "\n\nКосинусное правило: cos a = cos b cos c + sin b sin c cos α = " + num(cos(lb) * cos(lc) + sin(lb) * sin(lc) * cos(aA), 3) + " (cos a = " + num(cos(la), 3) + "). Синусное: sin a / sin α = " + format(sin(la) / sin(aA), 3) + ", sin b / sin β = " + format(sin(lb) / sin(aB), 3) + ", sin c / sin γ = " + format(sin(lc) / sin(aC), 3) + ".";
  float pp = sp / 2;
  info = info + " Тангенс половины двугранного угла: tg(α/2) = " + format(tan(aA / 2), 3) + " = √(sin(p − b) sin(p − c) / (sin p sin(p − a))) = " + format(sqrt(abs(sin(pp - lb) * sin(pp - lc) / (sin(pp) * sin(pp - la)))), 3) + ", p = (a + b + c)/2.";
  if (pol) {
    info = info + "\n\n**Взаимный угол** (жёлтые лучи OA′, OB′, OC′ перпендикулярны граням): его плоские углы " + format(degrees(lpa), 1) + "°, " + format(degrees(lpb), 1) + "°, " + format(degrees(lpc), 1) + "° дополняют α, β, γ до 180°, а двугранные равны 180° − a, 180° − b, 180° − c.";
  }
}
]
