[
description = "{info}"

field width = 14; field height = 14; field depth = 14;
show grid = false; show axes = false;
camera start rot = (25, 65);
camera start zoom = 1.6;

draw Surface { name = "sph"; type = parametric; x = "Rs * sin(pi * u) * cos(6.283185 * v)"; y = "Rs * cos(pi * u)"; z = "Rs * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 32; color = #3b82f6; opacity = 0.1 }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("O"); color = #f59e0b }
new Point3D { name = "P1"; pos = (2.44, 0.81, 0.81); pauseOnDrag = false; text = true("A"); active = n > 0 }
new Point3D { name = "P2"; pos = (-1.90, 1.36, 1.36); pauseOnDrag = false; text = true("B"); active = n > 1 }
new Point3D { name = "P3"; pos = (0.27, -2.45, 1.09); pauseOnDrag = false; text = true("C"); active = n > 2 }
new Point3D { name = "P4"; pos = (-0.84, 0.56, -2.51); pauseOnDrag = false; text = true("D"); active = n > 3 }
new Point3D { name = "P5"; pos = (1.07, 2.42, -0.54); pauseOnDrag = false; text = true("E"); active = n > 4 }
new Point3D { name = "P6"; pos = (-2.45, -1.09, -0.27); pauseOnDrag = false; text = true("F"); active = n > 5 }
new Point3D { name = "P7"; pos = (1.67, -0.84, -1.95); pauseOnDrag = false; text = true("G"); active = n > 6 }
new Line3D { name = "e01"; pos = (P1, P2); interact = false; thickness = 3; active = ed[1] > 0.5 }
new Line3D { name = "e02"; pos = (P1, P3); interact = false; thickness = 3; active = ed[2] > 0.5 }
new Line3D { name = "e03"; pos = (P1, P4); interact = false; thickness = 3; active = ed[3] > 0.5 }
new Line3D { name = "e04"; pos = (P1, P5); interact = false; thickness = 3; active = ed[4] > 0.5 }
new Line3D { name = "e05"; pos = (P1, P6); interact = false; thickness = 3; active = ed[5] > 0.5 }
new Line3D { name = "e06"; pos = (P1, P7); interact = false; thickness = 3; active = ed[6] > 0.5 }
new Line3D { name = "e12"; pos = (P2, P3); interact = false; thickness = 3; active = ed[9] > 0.5 }
new Line3D { name = "e13"; pos = (P2, P4); interact = false; thickness = 3; active = ed[10] > 0.5 }
new Line3D { name = "e14"; pos = (P2, P5); interact = false; thickness = 3; active = ed[11] > 0.5 }
new Line3D { name = "e15"; pos = (P2, P6); interact = false; thickness = 3; active = ed[12] > 0.5 }
new Line3D { name = "e16"; pos = (P2, P7); interact = false; thickness = 3; active = ed[13] > 0.5 }
new Line3D { name = "e23"; pos = (P3, P4); interact = false; thickness = 3; active = ed[17] > 0.5 }
new Line3D { name = "e24"; pos = (P3, P5); interact = false; thickness = 3; active = ed[18] > 0.5 }
new Line3D { name = "e25"; pos = (P3, P6); interact = false; thickness = 3; active = ed[19] > 0.5 }
new Line3D { name = "e26"; pos = (P3, P7); interact = false; thickness = 3; active = ed[20] > 0.5 }
new Line3D { name = "e34"; pos = (P4, P5); interact = false; thickness = 3; active = ed[25] > 0.5 }
new Line3D { name = "e35"; pos = (P4, P6); interact = false; thickness = 3; active = ed[26] > 0.5 }
new Line3D { name = "e36"; pos = (P4, P7); interact = false; thickness = 3; active = ed[27] > 0.5 }
new Line3D { name = "e45"; pos = (P5, P6); interact = false; thickness = 3; active = ed[33] > 0.5 }
new Line3D { name = "e46"; pos = (P5, P7); interact = false; thickness = 3; active = ed[34] > 0.5 }
new Line3D { name = "e56"; pos = (P6, P7); interact = false; thickness = 3; active = ed[41] > 0.5 }

new UI { type = slider; label = "число вершин n"; variable = n; min = 4; max = 7; step = 1; default = 6 }
new UI { type = slider; label = "радиус сферы R"; variable = Rs; min = 2; max = 3.4; step = 0.1; default = 2.7 }

string info = "";
float n = 6; float Rs = 2.7; float oldR = 2.7; float nE = 0; float nF = 0; float maxE = 0; float minE = 0;
list px = (0, 0, 0, 0, 0, 0, 0); list py = (0, 0, 0, 0, 0, 0, 0); list pz = (0, 0, 0, 0, 0, 0, 0);
list ed = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
float ready = 0;
Function det3(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz) {
  float ux = bx - ax; float uy = by - ay; float uz = bz - az;
  float vx = cx - ax; float vy = cy - ay; float vz = cz - az;
  float wx = dx - ax; float wy = dy - ay; float wz = dz - az;
  return ux * (vy * wz - vz * wy) - uy * (vx * wz - vz * wx) + uz * (vx * wy - vy * wx);
}
Function fix(P, k) {
  float r = sqrt(P.pos.x * P.pos.x + P.pos.y * P.pos.y + P.pos.z * P.pos.z);
  float good = 1;
  if (r < 0.05) { good = 0; } else if (abs(r - Rs) > 0.000001) { P.pos.x = P.pos.x * Rs / r; P.pos.y = P.pos.y * Rs / r; P.pos.z = P.pos.z * Rs / r; }
  if (good == 1) {
    repeat (n) { float j = i; if (j != k) {
      float dx = P.pos.x - px[j]; float dy = P.pos.y - py[j]; float dz = P.pos.z - pz[j];
      if (dx * dx + dy * dy + dz * dz < 0.09 * Rs * Rs) { good = 0; }
    } }
  }
  if (good == 1 && k < 4) {
    float a = 0; float b = 1; float c = 2;
    if (k == 0) { a = 3; } if (k == 1) { b = 3; } if (k == 2) { c = 3; }
    float dd = 0;
    if (k == 3) { dd = det3(px[0], py[0], pz[0], px[1], py[1], pz[1], px[2], py[2], pz[2], P.pos.x, P.pos.y, P.pos.z); }
    if (k == 0) { dd = det3(P.pos.x, P.pos.y, P.pos.z, px[1], py[1], pz[1], px[2], py[2], pz[2], px[3], py[3], pz[3]); }
    if (k == 1) { dd = det3(px[0], py[0], pz[0], P.pos.x, P.pos.y, P.pos.z, px[2], py[2], pz[2], px[3], py[3], pz[3]); }
    if (k == 2) { dd = det3(px[0], py[0], pz[0], px[1], py[1], pz[1], P.pos.x, P.pos.y, P.pos.z, px[3], py[3], pz[3]); }
    if (abs(dd) < 0.1 * Rs * Rs * Rs) { good = 0; }
  }
  if (good == 1) { px[k] = P.pos.x; py[k] = P.pos.y; pz[k] = P.pos.z; }
  else { P.pos.x = px[k]; P.pos.y = py[k]; P.pos.z = pz[k]; }
}
Function hull() {
  repeat (49) { ed[i] = 0; }
  nE = 0; nF = 0;
  repeat (n) { float a = i; repeat (n) { float b = i; if (b > a) { repeat (n) { float c = i; if (c > b) {
    float nx = (py[b] - py[a]) * (pz[c] - pz[a]) - (pz[b] - pz[a]) * (py[c] - py[a]);
    float ny = (pz[b] - pz[a]) * (px[c] - px[a]) - (px[b] - px[a]) * (pz[c] - pz[a]);
    float nz = (px[b] - px[a]) * (py[c] - py[a]) - (py[b] - py[a]) * (px[c] - px[a]);
    float pos = 0; float neg = 0;
    repeat (n) { float m = i; if (m != a && m != b && m != c) {
      float s = nx * (px[m] - px[a]) + ny * (py[m] - py[a]) + nz * (pz[m] - pz[a]);
      if (s > 0.05) { pos = pos + 1; } else if (s < -0.05) { neg = neg + 1; } else { pos = pos + 100; neg = neg + 100; }
    } }
    if (pos == 0 || neg == 0) { nF = nF + 1; ed[a * 7 + b] = 1; ed[a * 7 + c] = 1; ed[b * 7 + c] = 1; }
  } } } } }
  repeat (49) { nE = nE + ed[i]; }
}
Function edgeLen(a, b) { return sqrt((px[a] - px[b]) * (px[a] - px[b]) + (py[a] - py[b]) * (py[a] - py[b]) + (pz[a] - pz[b]) * (pz[a] - pz[b])); }
Function init() {
  px[0] = P1.pos.x; py[0] = P1.pos.y; pz[0] = P1.pos.z; px[1] = P2.pos.x; py[1] = P2.pos.y; pz[1] = P2.pos.z;
  px[2] = P3.pos.x; py[2] = P3.pos.y; pz[2] = P3.pos.z; px[3] = P4.pos.x; py[3] = P4.pos.y; pz[3] = P4.pos.z;
  px[4] = P5.pos.x; py[4] = P5.pos.y; pz[4] = P5.pos.z; px[5] = P6.pos.x; py[5] = P6.pos.y; pz[5] = P6.pos.z;
  px[6] = P7.pos.x; py[6] = P7.pos.y; pz[6] = P7.pos.z;
}
Update {
  if (ready == 0) { init(); ready = 1; }
  if (abs(Rs - oldR) > 0.000001) {
    repeat (7) { px[i] = px[i] * Rs / oldR; py[i] = py[i] * Rs / oldR; pz[i] = pz[i] * Rs / oldR; }
    oldR = Rs;
  }
  fix(P1, 0); fix(P2, 1); fix(P3, 2); fix(P4, 3);
  if (n > 4) { fix(P5, 4); } if (n > 5) { fix(P6, 5); } if (n > 6) { fix(P7, 6); }
  hull();
  maxE = 0; minE = 100;
  repeat (n) { float a = i; repeat (n) { float b = i; if (b > a && ed[a * 7 + b] > 0.5) {
    float l = edgeLen(a, b);
    if (l > maxE) { maxE = l; } if (l < minE) { minE = l; }
  } } }
  info = "**Вписанный многогранник.** Все " + format(n, 0) + " вершин многогранника лежат на сфере с центром O и радиусом R = " + format(Rs, 1) + ": OA = OB = … = R. Многогранник — выпуклая оболочка этих вершин: у него " + format(nF, 0) + " треугольных граней и " + format(nE, 0) + " рёбер.\n\n";
  info = info + "Вершины лежат на поверхности сферы, а рёбра и грани проходят внутри шара как хорды: самое длинное ребро " + format(maxE, 2) + " < 2R = " + format(2 * Rs, 1) + ", самое короткое " + format(minE, 2) + ". Сама сфера граней не содержит.\n\n";
  info = info + "Число вершин В = " + format(n, 0) + ", рёбер Р = " + format(nE, 0) + ", граней Г = " + format(nF, 0) + ", В − Р + Г = " + format(n - nE + nF, 0) + ".";
}
]
