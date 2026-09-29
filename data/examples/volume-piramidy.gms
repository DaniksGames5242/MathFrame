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
new Point3D { name = "Q3"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "Q4"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "Q5"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "Q6"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "Q7"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "QX"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "QY"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Line3D { name = "q0"; pos = (Q0, Q1); interact = false; thickness = 5; color = #f59e0b; active = n > 1.5 }
new Line3D { name = "q1"; pos = (Q1, Q2); interact = false; thickness = 5; color = #f59e0b; active = n > 2.5 }
new Line3D { name = "q2"; pos = (Q2, Q3); interact = false; thickness = 5; color = #f59e0b; active = n > 3.5 }
new Line3D { name = "q3"; pos = (Q3, Q4); interact = false; thickness = 5; color = #f59e0b; active = n > 4.5 }
new Line3D { name = "q4"; pos = (Q4, Q5); interact = false; thickness = 5; color = #f59e0b; active = n > 5.5 }
new Line3D { name = "q5"; pos = (Q5, Q6); interact = false; thickness = 5; color = #f59e0b; active = n > 6.5 }
new Line3D { name = "q6"; pos = (Q6, Q7); interact = false; thickness = 5; color = #f59e0b; active = n > 7.5 }
new Line3D { name = "qc"; pos = (QX, QY); interact = false; thickness = 5; color = #f59e0b }

new UI { name = "s_n"; type = slider; label = "число сторон основания n"; variable = n; min = 3; max = 8; step = 1; default = 4 }
new UI { name = "s_h"; type = slider; label = "высота h"; variable = hh; min = 2; max = 5; step = 0.1; default = 4 }
new UI { name = "s_d"; type = slider; label = "смещение вершины параллельно основанию"; variable = d; min = 0; max = 3; step = 0.05; default = 0 }
new UI { name = "s_psi"; type = slider; label = "направление смещения, °"; variable = psi; min = 0; max = 360; step = 1; default = 40 }
new UI { name = "s_s"; type = slider; label = "сечение: доля высоты от основания"; variable = s; min = 0; max = 0.9; step = 0.01; default = 0.4 }

string info = "";
float n = 4; float R = 2.4; float hh = 4; float d = 0; float psi = 40; float s = 0.4;
float ax = 0; float az = 0;
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
Function sec(P, k) { P.pos.x = qx(k) + s * (ax - qx(k)); P.pos.y = -hh / 2 + s * hh; P.pos.z = qz(k) + s * (az - qz(k)); }
// объём тетраэдра (O, A_k, A_k+1, вершина): O — центр основания
Function tet(k) {
  float ux = qx(k) - ax; float uy = -hh; float uz = qz(k) - az;
  float vx = qx(k + 1) - ax; float vy = -hh; float vz = qz(k + 1) - az;
  float wx = -ax; float wy = -hh; float wz = -az;
  return abs(ux * (vy * wz - vz * wy) - uy * (vx * wz - vz * wx) + uz * (vx * wy - vy * wx)) / 6;
}
Function vsum() { float t = 0; repeat (n) { t = t + tet(i); } return t; }

Update {
  n = round(n);
  ax = d * cos(radians(psi)); az = d * sin(radians(psi));
  put(A1, 0); put(A2, 1); put(A3, 2); put(A4, 3); put(A5, 4); put(A6, 5); put(A7, 6); put(A8, 7);
  put(X, n - 1); put(Y, 0); apex(S);
  sec(Q0, 0); sec(Q1, 1); sec(Q2, 2); sec(Q3, 3); sec(Q4, 4); sec(Q5, 5); sec(Q6, 6); sec(Q7, 7);
  sec(QX, n - 1); sec(QY, 0);
  float so = sbase(); float v = so * hh / 3; float k = 1 - s;
  info = "**Объём пирамиды** — одна треть произведения площади основания на высоту: V = ⅓·S·h = ⅓·" + format(so, 2) + "·" + format(hh, 1) + " = **" + format(v, 2) + "**.

";
  info = info + "Призма с тем же основанием и высотой имеет объём S·h = " + format(so * hh, 2) + ": объём пирамиды ровно **втрое меньше** (" + format(v / (so * hh), 3) + " от призмы).

";
  info = info + "**Принцип Кавальери.** Плоскость на высоте " + format(s * hh, 2) + " от основания сечёт пирамиду по подобному многоугольнику с коэффициентом k = " + format(k, 2) + ", площадь сечения k²·S = **" + format(k * k * so, 2) + "**. Площадь сечения зависит только от высоты, поэтому смещение вершины параллельно основанию (сейчас на " + format(d, 2) + ") объём не меняет.

";
  info = info + "Проверка разбиением основания на " + format(n, 0) + " треугольников (из его центра): сумма объёмов получившихся пирамид = " + format(vsum(), 2) + ".";
}
]
