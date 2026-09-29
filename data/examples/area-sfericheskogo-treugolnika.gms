[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (0, 68);
camera start zoom = 1.25;

// ---- Сфера радиуса R (ползунок), сферический треугольник ABC (вершины перетаскиваются по сфере),
// стороны — дуги больших окружностей. Заливка — точки normalize(αa + βb + γc), α, β, γ ≥ 0. ----
draw Surface { name = "sph"; type = parametric; x = "R * sin(pi * u) * cos(6.283185 * v)"; y = "R * cos(pi * u)"; z = "R * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 32; color = #3b82f6; opacity = 0.25 }
draw Surface { name = "tri"; type = parametric; x = "fx(u, v)"; y = "fy(u, v)"; z = "fz(u, v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 16; color = #f59e0b; opacity = 0.55 }
new Curve3D { name = "sa"; type = parametric; x = "sl(t, bx, cx, oa)"; y = "sl(t, by, cy, oa)"; z = "sl(t, bz, cz, oa)"; segments = 60; color = #3b82f6; thickness = 4 }
new Curve3D { name = "sb"; type = parametric; x = "sl(t, cx, ax, ob)"; y = "sl(t, cy, ay, ob)"; z = "sl(t, cz, az, ob)"; segments = 60; color = #3b82f6; thickness = 4 }
new Curve3D { name = "sc"; type = parametric; x = "sl(t, ax, bx, oc)"; y = "sl(t, ay, by, oc)"; z = "sl(t, az, bz, oc)"; segments = 60; color = #3b82f6; thickness = 4 }
new Point3D { name = "A"; pos = (1.8, 0.9, 2.2); text = true("A"); pauseOnDrag = false; collideWithPoints = false }
new Point3D { name = "B"; pos = (-1.5, 1.0, 2.4); text = true("B"); pauseOnDrag = false; collideWithPoints = false }
new Point3D { name = "C"; pos = (0.15, -1.5, 2.6); text = true("C"); pauseOnDrag = false; collideWithPoints = false }

new UI { name = "sR"; type = slider; label = "радиус сферы R"; variable = R; min = 2; max = 3.4; step = 0.1; default = 3 }

// ---- Логика ----
float R = 3;
float ax = 0.6; float ay = 0.3; float az = 0.74;
float bx = -0.5; float by = 0.33; float bz = 0.8;
float cx = 0.05; float cy = -0.5; float cz = 0.87;
float oa = 1; float ob = 1; float oc = 1;
float al = 1; float be = 1; float ga = 1;
string info = "";

Function sl(t, p1, p2, om) { return R * (sin((1 - t) * om) * p1 + sin(t * om) * p2) / sin(om); }
Function wl(u, v, p1, p2, p3) { return (1 - u) * p1 + u * ((1 - v) * p2 + v * p3); }
Function fl(u, v) { float x = wl(u, v, ax, bx, cx); float y = wl(u, v, ay, by, cy); float z = wl(u, v, az, bz, cz); return sqrt(x * x + y * y + z * z) + 0.000001; }
Function fx(u, v) { return 1.007 * R * wl(u, v, ax, bx, cx) / fl(u, v); }
Function fy(u, v) { return 1.007 * R * wl(u, v, ay, by, cy) / fl(u, v); }
Function fz(u, v) { return 1.007 * R * wl(u, v, az, bz, cz) / fl(u, v); }
Function clamp(x) { if (x > 1) { return 1; } if (x < -1) { return -1; } return x; }
// угол при вершине p: между касательными к дугам в p к q и к r
Function ang(px, py, pz, qx, qy, qz, rx, ry, rz) {
  float dq = px * qx + py * qy + pz * qz; float dr = px * rx + py * ry + pz * rz;
  float ux = qx - dq * px; float uy = qy - dq * py; float uz = qz - dq * pz;
  float vx = rx - dr * px; float vy = ry - dr * py; float vz = rz - dr * pz;
  return acos(clamp((ux * vx + uy * vy + uz * vz) / (sqrt(ux * ux + uy * uy + uz * uz) * sqrt(vx * vx + vy * vy + vz * vz) + 0.000001)));
}
// треугольник допустим: вершины не сливаются, не противоположны и не лежат на одной большой окружности
Function okT(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
  float d12 = x1 * x2 + y1 * y2 + z1 * z2; float d13 = x1 * x3 + y1 * y3 + z1 * z3; float d23 = x2 * x3 + y2 * y3 + z2 * z3;
  float det = x1 * (y2 * z3 - z2 * y3) - y1 * (x2 * z3 - z2 * x3) + z1 * (x2 * y3 - y2 * x3);
  if (abs(d12) > 0.97) { return 0; } if (abs(d13) > 0.97) { return 0; } if (abs(d23) > 0.97) { return 0; }
  if (abs(det) < 0.12) { return 0; }
  return 1;
}
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  // проекция вершин на сферу
  float l = sqrt(A.pos.x * A.pos.x + A.pos.y * A.pos.y + A.pos.z * A.pos.z) + 0.000001;
  float nax = A.pos.x / l; float nay = A.pos.y / l; float naz = A.pos.z / l;
  l = sqrt(B.pos.x * B.pos.x + B.pos.y * B.pos.y + B.pos.z * B.pos.z) + 0.000001;
  float nbx = B.pos.x / l; float nby = B.pos.y / l; float nbz = B.pos.z / l;
  l = sqrt(C.pos.x * C.pos.x + C.pos.y * C.pos.y + C.pos.z * C.pos.z) + 0.000001;
  float ncx = C.pos.x / l; float ncy = C.pos.y / l; float ncz = C.pos.z / l;
  if (okT(nax, nay, naz, nbx, nby, nbz, ncx, ncy, ncz) > 0.5) {
    ax = nax; ay = nay; az = naz; bx = nbx; by = nby; bz = nbz; cx = ncx; cy = ncy; cz = ncz;
  }
  A.pos.x = R * ax; A.pos.y = R * ay; A.pos.z = R * az;
  B.pos.x = R * bx; B.pos.y = R * by; B.pos.z = R * bz;
  C.pos.x = R * cx; C.pos.y = R * cy; C.pos.z = R * cz;
  oa = acos(clamp(bx * cx + by * cy + bz * cz));
  ob = acos(clamp(cx * ax + cy * ay + cz * az));
  oc = acos(clamp(ax * bx + ay * by + az * bz));
  al = ang(ax, ay, az, bx, by, bz, cx, cy, cz);
  be = ang(bx, by, bz, cx, cy, cz, ax, ay, az);
  ga = ang(cx, cy, cz, ax, ay, az, bx, by, bz);
  float s = al + be + ga; float e = s - pi;
  float k = 180 / pi;
  float p = (oa + ob + oc) / 2;
  float q = tan(p / 2) * tan((p - oa) / 2) * tan((p - ob) / 2) * tan((p - oc) / 2);
  float el = 0; if (q > 0) { el = 4 * atan(sqrt(q)); }
  float S = R * R * e;
  info = "**Площадь сферического треугольника** на сфере радиуса R выражается только через его углы: S = R²(α + β + γ − π) = R²·E, где E — сферический избыток (углы в радианах).\n\n";
  info = info + "R = " + format(R, 1) + ", α = " + format(al * k, 1) + "°, β = " + format(be * k, 1) + "°, γ = " + format(ga * k, 1) + "°.\n";
  info = info + "E = " + format(s, 3) + " − " + format(pi, 3) + " = " + format(e, 3) + " рад.\n";
  info = info + "**S = " + format(R * R, 2) + " · " + format(e, 3) + " = " + format(S, 2) + "**, это " + format(100 * S / (4 * pi * R * R), 1) + "% площади всей сферы 4πR² = " + format(4 * pi * R * R, 1) + ".\n\n";
  info = info + "**Через двуугольники.** Двуугольник с углом α занимает долю α/2π сферы и имеет площадь 2R²α. Три двуугольника при вершинах: 2R²α + 2R²β + 2R²γ = " + format(2 * R * R * s, 2) + "; вычитая площадь полусферы 2πR² = " + format(2 * pi * R * R, 2) + ", получаем 2S = " + format(2 * S, 2) + ".\n\n";
  info = info + "**Формула Люилье** по сторонам a = " + format(oa * k, 1) + "°, b = " + format(ob * k, 1) + "°, c = " + format(oc * k, 1) + "° (p — полупериметр): E = 4·arctg √(tg(p/2)·tg((p−a)/2)·tg((p−b)/2)·tg((p−c)/2)) = " + format(el, 3) + " рад — то же значение избытка, S = R²·E = " + format(R * R * el, 2) + ".";
}
]
