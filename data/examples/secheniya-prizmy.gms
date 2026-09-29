[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.25;


// Призма и секущая плоскость (синяя), заданная нормалью (углы θ и ω) и сдвигом c от центра.
// Сечение (оранжевое) строится по точкам пересечения плоскости с рёбрами призмы.
new Point3D { name = "B0"; pos = (0, 0, 0); dynamic = false; collision = false; active = e0 }
new Point3D { name = "T0"; pos = (0, 0, 0); dynamic = false; collision = false; active = e0 }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; active = e1 }
new Point3D { name = "T1"; pos = (0, 0, 0); dynamic = false; collision = false; active = e1 }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; active = e2 }
new Point3D { name = "T2"; pos = (0, 0, 0); dynamic = false; collision = false; active = e2 }
new Point3D { name = "B3"; pos = (0, 0, 0); dynamic = false; collision = false; active = e3 }
new Point3D { name = "T3"; pos = (0, 0, 0); dynamic = false; collision = false; active = e3 }
new Point3D { name = "B4"; pos = (0, 0, 0); dynamic = false; collision = false; active = e4 }
new Point3D { name = "T4"; pos = (0, 0, 0); dynamic = false; collision = false; active = e4 }
new Point3D { name = "B5"; pos = (0, 0, 0); dynamic = false; collision = false; active = e5 }
new Point3D { name = "T5"; pos = (0, 0, 0); dynamic = false; collision = false; active = e5 }
new Point3D { name = "B6"; pos = (0, 0, 0); dynamic = false; collision = false; active = e6 }
new Point3D { name = "T6"; pos = (0, 0, 0); dynamic = false; collision = false; active = e6 }
new Point3D { name = "B7"; pos = (0, 0, 0); dynamic = false; collision = false; active = e7 }
new Point3D { name = "T7"; pos = (0, 0, 0); dynamic = false; collision = false; active = e7 }
new Point3D { name = "X"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Y"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "U"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "V"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "b0"; pos = (B0, B1); interact = false; thickness = 3; active = e1 }
new Line3D { name = "t0"; pos = (T0, T1); interact = false; thickness = 3; active = e1 }
new Line3D { name = "b1"; pos = (B1, B2); interact = false; thickness = 3; active = e2 }
new Line3D { name = "t1"; pos = (T1, T2); interact = false; thickness = 3; active = e2 }
new Line3D { name = "b2"; pos = (B2, B3); interact = false; thickness = 3; active = e3 }
new Line3D { name = "t2"; pos = (T2, T3); interact = false; thickness = 3; active = e3 }
new Line3D { name = "b3"; pos = (B3, B4); interact = false; thickness = 3; active = e4 }
new Line3D { name = "t3"; pos = (T3, T4); interact = false; thickness = 3; active = e4 }
new Line3D { name = "b4"; pos = (B4, B5); interact = false; thickness = 3; active = e5 }
new Line3D { name = "t4"; pos = (T4, T5); interact = false; thickness = 3; active = e5 }
new Line3D { name = "b5"; pos = (B5, B6); interact = false; thickness = 3; active = e6 }
new Line3D { name = "t5"; pos = (T5, T6); interact = false; thickness = 3; active = e6 }
new Line3D { name = "b6"; pos = (B6, B7); interact = false; thickness = 3; active = e7 }
new Line3D { name = "t6"; pos = (T6, T7); interact = false; thickness = 3; active = e7 }
new Line3D { name = "bc"; pos = (X, Y); interact = false; thickness = 3 }
new Line3D { name = "tc"; pos = (U, V); interact = false; thickness = 3 }
new Line3D { name = "l0"; pos = (B0, T0); interact = false; thickness = 2; active = e0 }
new Line3D { name = "l1"; pos = (B1, T1); interact = false; thickness = 2; active = e1 }
new Line3D { name = "l2"; pos = (B2, T2); interact = false; thickness = 2; active = e2 }
new Line3D { name = "l3"; pos = (B3, T3); interact = false; thickness = 2; active = e3 }
new Line3D { name = "l4"; pos = (B4, T4); interact = false; thickness = 2; active = e4 }
new Line3D { name = "l5"; pos = (B5, T5); interact = false; thickness = 2; active = e5 }
new Line3D { name = "l6"; pos = (B6, T6); interact = false; thickness = 2; active = e6 }
new Line3D { name = "l7"; pos = (B7, T7); interact = false; thickness = 2; active = e7 }

new Point3D { name = "S0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S3"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S4"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S5"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S6"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S7"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S8"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S9"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "P0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "P1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "P2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
draw InfPlane { name = "pl"; points = (P0, P1, P2); size = 3.4; opacity = 0.18; color = #3b82f6 }
new Line3D { name = "s0"; pos = (S0, S1); interact = false; thickness = 5; color = #f59e0b; active = g0 }
new Line3D { name = "s1"; pos = (S1, S2); interact = false; thickness = 5; color = #f59e0b; active = g1 }
new Line3D { name = "s2"; pos = (S2, S3); interact = false; thickness = 5; color = #f59e0b; active = g2 }
new Line3D { name = "s3"; pos = (S3, S4); interact = false; thickness = 5; color = #f59e0b; active = g3 }
new Line3D { name = "s4"; pos = (S4, S5); interact = false; thickness = 5; color = #f59e0b; active = g4 }
new Line3D { name = "s5"; pos = (S5, S6); interact = false; thickness = 5; color = #f59e0b; active = g5 }
new Line3D { name = "s6"; pos = (S6, S7); interact = false; thickness = 5; color = #f59e0b; active = g6 }
new Line3D { name = "s7"; pos = (S7, S8); interact = false; thickness = 5; color = #f59e0b; active = g7 }
new Line3D { name = "s8"; pos = (S8, S9); interact = false; thickness = 5; color = #f59e0b; active = g8 }
new Line3D { name = "s9"; pos = (S9, S0); interact = false; thickness = 5; color = #f59e0b; active = g9 }

new UI { name = "s_n"; type = slider; label = "число сторон основания n"; variable = n; min = 3; max = 8; step = 1; default = 5 }
new UI { name = "s_h"; type = slider; label = "высота h"; variable = h; min = 2.5; max = 5; step = 0.1; default = 4 }
new UI { name = "s_phi"; type = slider; label = "наклон боковых рёбер φ, °"; variable = phi; min = 0; max = 40; step = 1; default = 0 }
new UI { name = "s_psi"; type = slider; label = "направление наклона, °"; variable = psi; min = 0; max = 360; step = 1; default = 30 }
new UI { name = "s_th"; type = slider; label = "наклон плоскости θ, °"; variable = th; min = 0; max = 90; step = 1; default = 35 }
new UI { name = "s_om"; type = slider; label = "поворот плоскости ω, °"; variable = om; min = 0; max = 360; step = 1; default = 20 }
new UI { name = "s_c"; type = slider; label = "сдвиг плоскости c"; variable = c; min = -4; max = 4; step = 0.1; default = 0.3 }

string info = "";
float n = 5; float R = 2.2; float h = 4; float phi = 0; float psi = 30; float th = 35; float om = 20; float c = 0.3;
float dx = 0; float dz = 0; float nx = 0; float ny = 1; float nz = 0; float m = 0; float cb = 0; float ct = 0;
float e0 = 1; float e1 = 1; float e2 = 1; float e3 = 1; float e4 = 1; float e5 = 1; float e6 = 1; float e7 = 1;
float g0 = 0; float g1 = 0; float g2 = 0; float g3 = 0; float g4 = 0; float g5 = 0; float g6 = 0; float g7 = 0; float g8 = 0; float g9 = 0;
list lx = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list ly = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list lz = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list an = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list ox = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list oy = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list oz = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function qx(k) { return R * cos(6.283185 * k / n); }
Function qz(k) { return R * sin(6.283185 * k / n); }
Function bx(k) { return qx(k) - dx / 2; }
Function bz(k) { return qz(k) - dz / 2; }
Function put(P, Q, k) {
  P.pos.x = bx(k); P.pos.y = -h / 2; P.pos.z = bz(k);
  Q.pos.x = P.pos.x + dx; Q.pos.y = h / 2; Q.pos.z = P.pos.z + dz;
}
Function fv(x, y, z) { return nx * x + ny * y + nz * z - c; }
Function sg(x) { if (x >= 0) { return 1; } return 0; }
Function add(x, y, z) { lx[m] = x; ly[m] = y; lz[m] = z; m = m + 1; }
Function collect() {
  m = 0; cb = 0; ct = 0;
  repeat (n) {
    float k = i;
    float f0 = fv(bx(k), -h / 2, bz(k)); float f1 = fv(bx(k) + dx, h / 2, bz(k) + dz);
    float f2 = fv(bx(k + 1), -h / 2, bz(k + 1)); float f3 = fv(bx(k + 1) + dx, h / 2, bz(k + 1) + dz);
    if (sg(f0) != sg(f1)) { float t = f0 / (f0 - f1); add(bx(k) + t * dx, -h / 2 + t * h, bz(k) + t * dz); }
    if (sg(f0) != sg(f2)) { float u = f0 / (f0 - f2); add(bx(k) + u * (bx(k + 1) - bx(k)), -h / 2, bz(k) + u * (bz(k + 1) - bz(k))); cb = cb + 1; }
    if (sg(f1) != sg(f3)) { float v = f1 / (f1 - f3); add(bx(k) + dx + v * (bx(k + 1) - bx(k)), h / 2, bz(k) + dz + v * (bz(k + 1) - bz(k))); ct = ct + 1; }
  }
}
Function order() {
  float cx = 0; float cy = 0; float cz = 0;
  repeat (m) { cx = cx + lx[i] / m; cy = cy + ly[i] / m; cz = cz + lz[i] / m; }
  float rx = 0; float ry = 1; float rz = 0;
  if (abs(ny) > 0.9) { rx = 1; ry = 0; }
  float e1x = ny * rz - nz * ry; float e1y = nz * rx - nx * rz; float e1z = nx * ry - ny * rx;
  float el = sqrt(e1x * e1x + e1y * e1y + e1z * e1z);
  e1x = e1x / el; e1y = e1y / el; e1z = e1z / el;
  float e2x = ny * e1z - nz * e1y; float e2y = nz * e1x - nx * e1z; float e2z = nx * e1y - ny * e1x;
  repeat (m) {
    float dxx = lx[i] - cx; float dyy = ly[i] - cy; float dzz = lz[i] - cz;
    an[i] = atan2(dxx * e2x + dyy * e2y + dzz * e2z, dxx * e1x + dyy * e1y + dzz * e1z);
  }
  repeat (m) {
    float ii = i; float rk = 0;
    repeat (m) { if (an[i] < an[ii] || (an[i] == an[ii] && i < ii)) { rk = rk + 1; } }
    ox[rk] = lx[ii]; oy[rk] = ly[ii]; oz[rk] = lz[ii];
  }
}
Function place(P, r) {
  float q = r; if (r >= m) { q = 0; }
  P.pos.x = ox[q]; P.pos.y = oy[q]; P.pos.z = oz[q];
}
Function nxt(j) { if (j + 1 >= m) { return 0; } return j + 1; }
Function sv(j, w) {
  float a = nxt(j);
  if (w == 0) { return ox[a] - ox[j]; } if (w == 1) { return oy[a] - oy[j]; } return oz[a] - oz[j];
}
Function pairs() {
  float s = 0;
  repeat (m) {
    float jj = i;
    repeat (m) {
      if (i > jj) {
        float ax = sv(jj, 0); float ay = sv(jj, 1); float az = sv(jj, 2); float bx2 = sv(i, 0); float by2 = sv(i, 1); float bz2 = sv(i, 2);
        float cx = ay * bz2 - az * by2; float cy = az * bx2 - ax * bz2; float cz = ax * by2 - ay * bx2;
        if (sqrt(cx * cx + cy * cy + cz * cz) < 0.0001 * sqrt(ax * ax + ay * ay + az * az) * sqrt(bx2 * bx2 + by2 * by2 + bz2 * bz2)) { s = s + 1; }
      }
    }
  }
  return s;
}
Function secArea() {
  float sx = 0; float sy = 0; float sz = 0;
  repeat (m) {
    float a = nxt(i);
    sx = sx + oy[i] * oz[a] - oz[i] * oy[a]; sy = sy + oz[i] * ox[a] - ox[i] * oz[a]; sz = sz + ox[i] * oy[a] - oy[i] * ox[a];
  }
  return sqrt(sx * sx + sy * sy + sz * sz) / 2;
}
Function area() { float s = 0; repeat (n) { s = s + qx(i) * qz(i + 1) - qx(i + 1) * qz(i); } return abs(s) / 2; }
Function poly(k) {
  if (k == 3) { return "треугольник"; } if (k == 4) { return "четырёхугольник"; } if (k == 5) { return "пятиугольник"; }
  if (k == 6) { return "шестиугольник"; } if (k == 7) { return "семиугольник"; } if (k == 8) { return "восьмиугольник"; }
  if (k == 9) { return "девятиугольник"; } return "десятиугольник";
}

Update {
  float g = radians(phi); float a = radians(psi);
  dx = h * tan(g) * cos(a); dz = h * tan(g) * sin(a);
  float o = round(n); n = o;
  e0 = 0; if (n > 0.5) { e0 = 1; }
  e1 = 0; if (n > 1.5) { e1 = 1; }
  e2 = 0; if (n > 2.5) { e2 = 1; }
  e3 = 0; if (n > 3.5) { e3 = 1; }
  e4 = 0; if (n > 4.5) { e4 = 1; }
  e5 = 0; if (n > 5.5) { e5 = 1; }
  e6 = 0; if (n > 6.5) { e6 = 1; }
  e7 = 0; if (n > 7.5) { e7 = 1; }
  put(B0, T0, 0);
  put(B1, T1, 1);
  put(B2, T2, 2);
  put(B3, T3, 3);
  put(B4, T4, 4);
  put(B5, T5, 5);
  put(B6, T6, 6);
  put(B7, T7, 7);
  put(X, U, n - 1); put(Y, V, 0);
  float t1 = radians(th); float t2 = radians(om);
  nx = sin(t1) * cos(t2); ny = cos(t1); nz = sin(t1) * sin(t2);
  collect();
  if (m > 2) { order(); }
  place(S0, 0);
  place(S1, 1);
  place(S2, 2);
  place(S3, 3);
  place(S4, 4);
  place(S5, 5);
  place(S6, 6);
  place(S7, 7);
  place(S8, 8);
  place(S9, 9);
  g0 = 0; if (m > 2 && 0 < m) { g0 = 1; }
  g1 = 0; if (m > 2 && 1 < m) { g1 = 1; }
  g2 = 0; if (m > 2 && 2 < m) { g2 = 1; }
  g3 = 0; if (m > 2 && 3 < m) { g3 = 1; }
  g4 = 0; if (m > 2 && 4 < m) { g4 = 1; }
  g5 = 0; if (m > 2 && 5 < m) { g5 = 1; }
  g6 = 0; if (m > 2 && 6 < m) { g6 = 1; }
  g7 = 0; if (m > 2 && 7 < m) { g7 = 1; }
  g8 = 0; if (m > 2 && 8 < m) { g8 = 1; }
  g9 = 0; if (m > 2 && 9 < m) { g9 = 1; }
  float rx = 0; float ry = 1; float rz = 0;
  if (abs(ny) > 0.9) { rx = 1; ry = 0; }
  float ux = ny * rz - nz * ry; float uy = nz * rx - nx * rz; float uz = nx * ry - ny * rx;
  float ul = sqrt(ux * ux + uy * uy + uz * uz); ux = ux / ul; uy = uy / ul; uz = uz / ul;
  float vx = ny * uz - nz * uy; float vy = nz * ux - nx * uz; float vz = nx * uy - ny * ux;
  P0.pos.x = c * nx; P0.pos.y = c * ny; P0.pos.z = c * nz;
  P1.pos.x = c * nx + 3 * ux; P1.pos.y = c * ny + 3 * uy; P1.pos.z = c * nz + 3 * uz;
  P2.pos.x = c * nx + 3 * vx; P2.pos.y = c * ny + 3 * vy; P2.pos.z = c * nz + 3 * vz;
  float l = sqrt(dx * dx + h * h + dz * dz);
  float par = abs(nx * dx + ny * h + nz * dz) / l;
  info = "**Сечение призмы** плоскостью — многоугольник, каждая сторона которого лежит в одной грани призмы: плоскость пересекает грань по отрезку.\n\n";
  if (m < 3) {
    info = info + "Сейчас плоскость не пересекает призму (или касается её): сечения нет.";
  } else {
    float pb = 0; if (cb > 0) { pb = 1; } if (ct > 0) { pb = pb + 1; }
    info = info + "Сечение — **" + poly(m) + "**. Сторон на боковых гранях: " + format(m - pb, 0) + " (всего боковых граней " + format(n, 0) + "), на основаниях: " + format(pb, 0) + ". Пар параллельных сторон: **" + format(pairs(), 0) + "**. Площадь сечения " + format(secArea(), 2) + ", площадь основания " + format(area(), 2) + ".\n\n";
    if (pb == 0) { info = info + "Плоскость не задевает оснований, поэтому сторон не больше числа боковых граней. "; }
    if (th == 0) { info = info + "Плоскость параллельна основаниям — сечение конгруэнтно основанию. "; }
    if (par < 0.001) {
      if (phi == 0) { info = info + "Плоскость параллельна боковому ребру прямой призмы — сечение прямоугольник."; }
      else { info = info + "Плоскость параллельна боковому ребру наклонной призмы — сечение параллелограмм."; }
    }
  }
}
]
