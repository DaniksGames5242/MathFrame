[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.7;

new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 0.5}
new Point3D { name = "A2"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 1.5}
new Point3D { name = "A3"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 2.5}
new Point3D { name = "A4"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 3.5}
new Point3D { name = "A5"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 4.5}
new Point3D { name = "A6"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 5.5}
new Point3D { name = "A7"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 6.5}
new Point3D { name = "A8"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 7.5}
new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; }
new Point3D { name = "X"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "Y"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Line3D { name = "b0"; pos = (A1, A2); interact = false; thickness = 3; active = n > 1.5 }
new Line3D { name = "b1"; pos = (A2, A3); interact = false; thickness = 3; active = n > 2.5 }
new Line3D { name = "b2"; pos = (A3, A4); interact = false; thickness = 3; active = n > 3.5 }
new Line3D { name = "b3"; pos = (A4, A5); interact = false; thickness = 3; active = n > 4.5 }
new Line3D { name = "b4"; pos = (A5, A6); interact = false; thickness = 3; active = n > 5.5 }
new Line3D { name = "b5"; pos = (A6, A7); interact = false; thickness = 3; active = n > 6.5 }
new Line3D { name = "b6"; pos = (A7, A8); interact = false; thickness = 3; active = n > 7.5 }
new Line3D { name = "bc"; pos = (X, Y); interact = false; thickness = 3 }
new Line3D { name = "l0"; pos = (A1, S); interact = false; thickness = 2; active = n > 0.5 }
new Line3D { name = "l1"; pos = (A2, S); interact = false; thickness = 2; active = n > 1.5 }
new Line3D { name = "l2"; pos = (A3, S); interact = false; thickness = 2; active = n > 2.5 }
new Line3D { name = "l3"; pos = (A4, S); interact = false; thickness = 2; active = n > 3.5 }
new Line3D { name = "l4"; pos = (A5, S); interact = false; thickness = 2; active = n > 4.5 }
new Line3D { name = "l5"; pos = (A6, S); interact = false; thickness = 2; active = n > 5.5 }
new Line3D { name = "l6"; pos = (A7, S); interact = false; thickness = 2; active = n > 6.5 }
new Line3D { name = "l7"; pos = (A8, S); interact = false; thickness = 2; active = n > 7.5 }
new Point3D { name = "Q0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "Q1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "Q2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SA0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SB0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SA1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SB1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SA2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SB2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SA3"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SB3"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SA4"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SB4"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SA5"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SB5"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SA6"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SB6"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SA7"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SB7"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SA8"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "SB8"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Line3D { name = "s0"; pos = (SA0, SB0); interact = false; thickness = 5; color = #f59e0b; active = sg0 }
new Line3D { name = "s1"; pos = (SA1, SB1); interact = false; thickness = 5; color = #f59e0b; active = sg1 }
new Line3D { name = "s2"; pos = (SA2, SB2); interact = false; thickness = 5; color = #f59e0b; active = sg2 }
new Line3D { name = "s3"; pos = (SA3, SB3); interact = false; thickness = 5; color = #f59e0b; active = sg3 }
new Line3D { name = "s4"; pos = (SA4, SB4); interact = false; thickness = 5; color = #f59e0b; active = sg4 }
new Line3D { name = "s5"; pos = (SA5, SB5); interact = false; thickness = 5; color = #f59e0b; active = sg5 }
new Line3D { name = "s6"; pos = (SA6, SB6); interact = false; thickness = 5; color = #f59e0b; active = sg6 }
new Line3D { name = "s7"; pos = (SA7, SB7); interact = false; thickness = 5; color = #f59e0b; active = sg7 }
new Line3D { name = "s8"; pos = (SA8, SB8); interact = false; thickness = 5; color = #f59e0b; active = sg8 }
draw InfPlane { name = "pl"; points = (Q0, Q1, Q2); color = #3b82f6; opacity = 0.16; size = 2.8 }

new UI { name = "s_n"; type = slider; label = "число сторон основания n"; variable = n; min = 3; max = 8; step = 1; default = 4 }
new UI { name = "s_h"; type = slider; label = "высота H"; variable = hh; min = 2; max = 5; step = 0.1; default = 4 }
new UI { name = "s_t"; type = slider; label = "плоскость: уровень на оси"; variable = t; min = 0.1; max = 0.9; step = 0.01; default = 0.5 }
new UI { name = "s_th"; type = slider; label = "наклон плоскости, °"; variable = th; min = 0; max = 60; step = 1; default = 25 }
new UI { name = "s_ps"; type = slider; label = "направление наклона, °"; variable = ps; min = 0; max = 360; step = 1; default = 30 }

string info = "";
float n = 4; float R = 2.4; float hh = 4; float t = 0.5; float th = 25; float ps = 30;
float ax = 0; float az = 0; float d = 0; float psi = 0;
float nx = 0; float ny = 1; float nz = 0; float yc = 0; float dS = 0;
float sg0 = 0; float sg1 = 0; float sg2 = 0; float sg3 = 0; float sg4 = 0; float sg5 = 0; float sg6 = 0; float sg7 = 0; float sg8 = 0;
Function qx(k) { return R * cos(6.283185 * k / n); }
Function qz(k) { return R * sin(6.283185 * k / n); }
Function put(P, k) { P.pos.x = qx(k); P.pos.y = -hh / 2; P.pos.z = qz(k); }
Function apex(P) { P.pos.x = ax; P.pos.y = hh / 2; P.pos.z = az; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function sub(k) { if (k < 1.5) { return "₁"; } if (k < 2.5) { return "₂"; } if (k < 3.5) { return "₃"; } if (k < 4.5) { return "₄"; } if (k < 5.5) { return "₅"; } if (k < 6.5) { return "₆"; } if (k < 7.5) { return "₇"; } return "₈"; }
Function side() { return 2 * R * sin(3.141593 / n); }
Function sbase() { return n * R * R * sin(6.283185 / n) / 2; }
// площадь k-й боковой грани (S, k, k+1)
Function face(k) {
  float ux = qx(k) - ax; float uy = -hh; float uz = qz(k) - az;
  float wx = qx(k + 1) - ax; float wy = -hh; float wz = qz(k + 1) - az;
  float c1 = uy * wz - uz * wy; float c2 = uz * wx - ux * wz; float c3 = ux * wy - uy * wx;
  return sqrt(c1 * c1 + c2 * c2 + c3 * c3) / 2;
}
// параметр основания апофемы на стороне k: вершина -> прямая (k, k+1)
Function ft(k) {
  float ex = qx(k + 1) - qx(k); float ez = qz(k + 1) - qz(k);
  return ((ax - qx(k)) * ex + (az - qz(k)) * ez) / (ex * ex + ez * ez);
}
Function apo(k) {
  float t = ft(k);
  float px = ax - qx(k) - t * (qx(k + 1) - qx(k)); float pz = az - qz(k) - t * (qz(k + 1) - qz(k));
  return sqrt(hh * hh + px * px + pz * pz);
}
Function lat() { float s = 0; repeat (n) { s = s + face(i); } return s; }

Function dv(j) { return nx * qx(j) + ny * (-hh / 2 - yc) + nz * qz(j); }
Function cL(j) { if (dS * dv(j) < 0) { return 1; } return 0; }
Function cE(j) { if (dv(j) * dv(j + 1) < 0) { return 1; } return 0; }
// точка пересечения плоскости с боковым ребром j и с ребром основания j
Function lp(P, j) { float u = dS / (dS - dv(j)); P.pos.x = ax + u * (qx(j) - ax); P.pos.y = hh / 2 - u * hh; P.pos.z = az + u * (qz(j) - az); }
Function bp(P, j) { float u = dv(j) / (dv(j) - dv(j + 1)); P.pos.x = qx(j) + u * (qx(j + 1) - qx(j)); P.pos.y = -hh / 2; P.pos.z = qz(j) + u * (qz(j + 1) - qz(j)); }
// отрезок сечения в боковой грани j (если плоскость её пересекает)
Function seg(PA, PB, j) {
  if (n < j + 0.5) { return 0; }
  float a = cL(j); float b = cL(j + 1); float c = cE(j);
  if (a + b > 1.5) { lp(PA, j); lp(PB, j + 1); return 1; }
  if (a + c > 1.5) { lp(PA, j); bp(PB, j); return 1; }
  if (b + c > 1.5) { lp(PA, j + 1); bp(PB, j); return 1; }
  return 0;
}
Function nlat() { float s = 0; repeat (n) { s = s + cL(i); } return s; }
Function firstE() { float r = -1; repeat (n) { if (r < 0 && cE(i) > 0.5) { r = i; } } return r; }
Function lastE() { float r = -1; repeat (n) { if (cE(i) > 0.5) { r = i; } } return r; }
Function pname(m) {
  if (m < 3.5) { return "треугольник"; } if (m < 4.5) { return "четырёхугольник"; } if (m < 5.5) { return "пятиугольник"; }
  if (m < 6.5) { return "шестиугольник"; } if (m < 7.5) { return "семиугольник"; } if (m < 8.5) { return "восьмиугольник"; }
  return "девятиугольник";
}

Update {
  n = round(n);
  float g = radians(th); float a = radians(ps);
  nx = sin(g) * cos(a); ny = cos(g); nz = sin(g) * sin(a);
  yc = -hh / 2 + t * hh;
  ax = 0; az = 0; dS = ny * (hh / 2 - yc);
  put(A1, 0); put(A2, 1); put(A3, 2); put(A4, 3); put(A5, 4); put(A6, 5); put(A7, 6); put(A8, 7);
  put(X, n - 1); put(Y, 0); apex(S);
  Q0.pos.x = 0; Q0.pos.y = yc; Q0.pos.z = 0;
  Q1.pos.x = cos(g) * cos(a); Q1.pos.y = yc - sin(g); Q1.pos.z = cos(g) * sin(a);
  Q2.pos.x = -sin(a); Q2.pos.y = yc; Q2.pos.z = cos(a);
  sg0 = seg(SA0, SB0, 0); sg1 = seg(SA1, SB1, 1); sg2 = seg(SA2, SB2, 2); sg3 = seg(SA3, SB3, 3); sg4 = seg(SA4, SB4, 4); sg5 = seg(SA5, SB5, 5); sg6 = seg(SA6, SB6, 6); sg7 = seg(SA7, SB7, 7);
  float f1 = firstE(); float f2 = lastE(); sg8 = 0;
  if (f1 > -0.5 && f2 > f1 + 0.5) { bp(SA8, f1); bp(SB8, f2); sg8 = 1; }
  float nl = nlat(); float m = nl + sg8;
  float so = sbase();
  info = "**Сечение** — грань, по которой секущая плоскость пересекает пирамиду. Пересечённых боковых рёбер: " + format(nl, 0);
  if (sg8 > 0.5) { info = info + " и плоскость режет основание (по хорде — ещё одна сторона сечения)"; }
  info = info + ". Значит, сечение — **" + pname(m) + "** (сторон: " + format(m, 0) + ").

";
  if (abs(dS) < 0.05) { info = info + "Плоскость проходит через вершину пирамиды: сечение вырождается — это треугольник или отрезок.

"; }
  if (th < 0.5) { info = info + "Плоскость параллельна основанию: сечение подобно основанию с коэффициентом k = " + format(1 - t, 2) + " (отношение расстояния от вершины ко всей высоте), площадь сечения k²·S = **" + format((1 - t) * (1 - t) * so, 2) + "** при S_осн = " + format(so, 2) + "."; }
  else { info = info + "Чтобы сечение стало подобно основанию, плоскость должна быть параллельна ему (наклон 0°)."; }
}
]
