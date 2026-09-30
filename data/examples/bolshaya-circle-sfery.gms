[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 62);
camera start zoom = 1.5;

// Сфера радиуса R = 1 показана радиусом 3. Точки N и M — полюса двух больших окружностей (нормали их плоскостей).
draw Surface { name = "sph"; type = parametric; x = "3 * sin(pi * u) * cos(6.283185 * v)"; y = "3 * cos(pi * u)"; z = "3 * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; color = #3b82f6; opacity = 0.08 }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "N"; pos = (0, 3, 0); text = true("N"); pauseOnDrag = false }
new Point3D { name = "M"; pos = (2.6, -0.9, 1); text = true("M"); pauseOnDrag = false }
new Point3D { name = "X"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("X") }
new Point3D { name = "Y"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("X′") }
new Line3D { name = "on"; pos = (O, N); interact = false; thickness = 2; color = #22c55e }
new Line3D { name = "om"; pos = (O, M); interact = false; thickness = 2; color = #22c55e }

new Curve3D { name = "g1"; type = parametric; x = "3 * (cos(6.283185 * t) * u1x + sin(6.283185 * t) * v1x)"; y = "3 * (cos(6.283185 * t) * u1y + sin(6.283185 * t) * v1y)"; z = "3 * (cos(6.283185 * t) * u1z + sin(6.283185 * t) * v1z)"; segments = 90; thickness = 5; color = #f59e0b }
new Curve3D { name = "g2"; type = parametric; x = "3 * (cos(6.283185 * t) * u2x + sin(6.283185 * t) * v2x)"; y = "3 * (cos(6.283185 * t) * u2y + sin(6.283185 * t) * v2y)"; z = "3 * (cos(6.283185 * t) * u2z + sin(6.283185 * t) * v2z)"; segments = 90; thickness = 5; color = #f59e0b }
// Малая окружность — сечение плоскостью, перпендикулярной ON, на расстоянии h от центра.
new Curve3D { name = "sm"; type = parametric; x = "cx + rr * (cos(6.283185 * t) * u1x + sin(6.283185 * t) * v1x)"; y = "cy + rr * (cos(6.283185 * t) * u1y + sin(6.283185 * t) * v1y)"; z = "cz + rr * (cos(6.283185 * t) * u1z + sin(6.283185 * t) * v1z)"; segments = 90; thickness = 5; color = #3b82f6; active = abs(h) > 0.03 }
new UI { name = "sH"; type = slider; label = "расстояние h от центра до секущей плоскости (в долях R)"; variable = h; min = -0.95; max = 0.95; step = 0.05; default = 0.5 }

string info = "";
float h = 0.5;
float u1x = 1; float u1y = 0; float u1z = 0; float v1x = 0; float v1y = 0; float v1z = 1;
float u2x = 1; float u2y = 0; float u2z = 0; float v2x = 0; float v2y = 0; float v2z = 1;
float cx = 0; float cy = 1.5; float cz = 0; float rr = 2.6;
float qnx = 0; float qny = 3; float qnz = 0; float qmx = 2.6; float qmy = -0.9; float qmz = 1;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function crx(ax, ay, az, bx, by, bz) { return ay * bz - az * by; }
Function cry(ax, ay, az, bx, by, bz) { return az * bx - ax * bz; }
Function crz(ax, ay, az, bx, by, bz) { return ax * by - ay * bx; }

Update {
  float rn = sqrt(N.pos.x * N.pos.x + N.pos.y * N.pos.y + N.pos.z * N.pos.z); if (rn < 0.01) { rn = 0.01; }
  float rm = sqrt(M.pos.x * M.pos.x + M.pos.y * M.pos.y + M.pos.z * M.pos.z); if (rm < 0.01) { rm = 0.01; }
  float ax = N.pos.x / rn; float ay = N.pos.y / rn; float az = N.pos.z / rn;
  float bx = M.pos.x / rm; float by = M.pos.y / rm; float bz = M.pos.z / rm;
  float dt = ax * bx + ay * by + az * bz;
  if (abs(dt) > 0.985) {
    // Недопустимый ход (окружности совпали): возвращаем последнее корректное положение.
    N.pos.x = qnx; N.pos.y = qny; N.pos.z = qnz; M.pos.x = qmx; M.pos.y = qmy; M.pos.z = qmz;
    ax = qnx / 3; ay = qny / 3; az = qnz / 3; bx = qmx / 3; by = qmy / 3; bz = qmz / 3;
    dt = ax * bx + ay * by + az * bz;
  } else {
    if (abs(rn - 3) > 0.0001 || abs(rm - 3) > 0.0001) {
      N.pos.x = 3 * ax; N.pos.y = 3 * ay; N.pos.z = 3 * az; M.pos.x = 3 * bx; M.pos.y = 3 * by; M.pos.z = 3 * bz;
    }
    qnx = 3 * ax; qny = 3 * ay; qnz = 3 * az; qmx = 3 * bx; qmy = 3 * by; qmz = 3 * bz;
  }
  // Ортонормированный базис плоскости большой окружности с нормалью a (и b).
  float hx = 0; float hy = 1; if (abs(ay) > 0.9) { hx = 1; hy = 0; }
  float px = crx(ax, ay, az, hx, hy, 0); float py = cry(ax, ay, az, hx, hy, 0); float pz = crz(ax, ay, az, hx, hy, 0);
  float pl = sqrt(px * px + py * py + pz * pz); u1x = px / pl; u1y = py / pl; u1z = pz / pl;
  v1x = crx(ax, ay, az, u1x, u1y, u1z); v1y = cry(ax, ay, az, u1x, u1y, u1z); v1z = crz(ax, ay, az, u1x, u1y, u1z);
  hx = 0; hy = 1; if (abs(by) > 0.9) { hx = 1; hy = 0; }
  px = crx(bx, by, bz, hx, hy, 0); py = cry(bx, by, bz, hx, hy, 0); pz = crz(bx, by, bz, hx, hy, 0);
  pl = sqrt(px * px + py * py + pz * pz); u2x = px / pl; u2y = py / pl; u2z = pz / pl;
  v2x = crx(bx, by, bz, u2x, u2y, u2z); v2y = cry(bx, by, bz, u2x, u2y, u2z); v2z = crz(bx, by, bz, u2x, u2y, u2z);
  cx = 3 * h * ax; cy = 3 * h * ay; cz = 3 * h * az; rr = 3 * sqrt(1 - h * h);
  // Пересечение двух больших окружностей: ±(a × b) / |a × b| — диаметрально противоположные точки.
  float ix = crx(ax, ay, az, bx, by, bz); float iy = cry(ax, ay, az, bx, by, bz); float iz = crz(ax, ay, az, bx, by, bz);
  float il = sqrt(ix * ix + iy * iy + iz * iz);
  X.pos.x = 3 * ix / il; X.pos.y = 3 * iy / il; X.pos.z = 3 * iz / il;
  Y.pos.x = -X.pos.x; Y.pos.y = -X.pos.y; Y.pos.z = -X.pos.z;
  float phi = degrees(acos(dt));
  float r = sqrt(1 - h * h);
  info = "**Большая окружность** сферы — сечение плоскостью, проходящей через центр O; жёлтые окружности лежат в плоскостях, перпендикулярных радиусам ON и OM. Их радиус равен радиусу сферы R.";
  if (abs(h) < 0.03) {
    info = info + "\n\nСекущая плоскость проходит через центр (h = 0): сечение — **большая окружность**, r = R, длина 2πR = **" + format(2 * pi, 3) + "** (при R = 1).";
  } else {
    info = info + "\n\nСиняя окружность — сечение плоскостью на расстоянии h = **" + num(h, 2) + "** R от центра; её радиус r = R√(1 − h²) = **" + format(r, 3) + "** R < R, центр не совпадает с центром сферы, длина 2πr = **" + format(2 * pi * r, 3) + "** < 2πR = " + format(2 * pi, 3) + " (при R = 1): это не большая окружность.";
  }
  info = info + "\n\nДве большие окружности пересекаются в двух диаметрально противоположных точках X и X′ (линия пересечения плоскостей — диаметр, каждая окружность делится пополам на дуги по 180°). Угол между окружностями равен двугранному углу между их плоскостями: **" + format(phi, 1) + "°** (смежный — " + format(180 - phi, 1) + "°).";
}
]
