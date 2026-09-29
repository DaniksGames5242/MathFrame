[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.25;


// Прямая призма над произвольным (в том числе невыпуклым) n-угольником-основанием.
// Основание разбито на треугольники с общей вершиной O.
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
new Line3D { name = "b0"; pos = (B0, B1); interact = false; thickness = 3; color = #3b82f6; active = e1 }
new Line3D { name = "t0"; pos = (T0, T1); interact = false; thickness = 3; color = #3b82f6; active = e1 }
new Line3D { name = "b1"; pos = (B1, B2); interact = false; thickness = 3; color = #3b82f6; active = e2 }
new Line3D { name = "t1"; pos = (T1, T2); interact = false; thickness = 3; color = #3b82f6; active = e2 }
new Line3D { name = "b2"; pos = (B2, B3); interact = false; thickness = 3; color = #3b82f6; active = e3 }
new Line3D { name = "t2"; pos = (T2, T3); interact = false; thickness = 3; color = #3b82f6; active = e3 }
new Line3D { name = "b3"; pos = (B3, B4); interact = false; thickness = 3; color = #3b82f6; active = e4 }
new Line3D { name = "t3"; pos = (T3, T4); interact = false; thickness = 3; color = #3b82f6; active = e4 }
new Line3D { name = "b4"; pos = (B4, B5); interact = false; thickness = 3; color = #3b82f6; active = e5 }
new Line3D { name = "t4"; pos = (T4, T5); interact = false; thickness = 3; color = #3b82f6; active = e5 }
new Line3D { name = "b5"; pos = (B5, B6); interact = false; thickness = 3; color = #3b82f6; active = e6 }
new Line3D { name = "t5"; pos = (T5, T6); interact = false; thickness = 3; color = #3b82f6; active = e6 }
new Line3D { name = "b6"; pos = (B6, B7); interact = false; thickness = 3; color = #3b82f6; active = e7 }
new Line3D { name = "t6"; pos = (T6, T7); interact = false; thickness = 3; color = #3b82f6; active = e7 }
new Line3D { name = "bc"; pos = (X, Y); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "tc"; pos = (U, V); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "l0"; pos = (B0, T0); interact = false; thickness = 2; active = e0 }
new Line3D { name = "l1"; pos = (B1, T1); interact = false; thickness = 2; active = e1 }
new Line3D { name = "l2"; pos = (B2, T2); interact = false; thickness = 2; active = e2 }
new Line3D { name = "l3"; pos = (B3, T3); interact = false; thickness = 2; active = e3 }
new Line3D { name = "l4"; pos = (B4, T4); interact = false; thickness = 2; active = e4 }
new Line3D { name = "l5"; pos = (B5, T5); interact = false; thickness = 2; active = e5 }
new Line3D { name = "l6"; pos = (B6, T6); interact = false; thickness = 2; active = e6 }
new Line3D { name = "l7"; pos = (B7, T7); interact = false; thickness = 2; active = e7 }

new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false }
new Line3D { name = "r0"; pos = (O, B0); interact = false; thickness = 1; active = e0 }
new Line3D { name = "r1"; pos = (O, B1); interact = false; thickness = 1; active = e1 }
new Line3D { name = "r2"; pos = (O, B2); interact = false; thickness = 1; active = e2 }
new Line3D { name = "r3"; pos = (O, B3); interact = false; thickness = 1; active = e3 }
new Line3D { name = "r4"; pos = (O, B4); interact = false; thickness = 1; active = e4 }
new Line3D { name = "r5"; pos = (O, B5); interact = false; thickness = 1; active = e5 }
new Line3D { name = "r6"; pos = (O, B6); interact = false; thickness = 1; active = e6 }
new Line3D { name = "r7"; pos = (O, B7); interact = false; thickness = 1; active = e7 }

new UI { name = "s_n"; type = slider; label = "число сторон основания n"; variable = n; min = 3; max = 8; step = 1; default = 5 }
new UI { name = "s_R"; type = slider; label = "размер основания"; variable = R; min = 1.2; max = 2.8; step = 0.1; default = 2.2 }
new UI { name = "s_ep"; type = slider; label = "неправильность основания"; variable = ep; min = 0; max = 0.45; step = 0.05; default = 0.25 }
new UI { name = "s_h"; type = slider; label = "высота h = боковое ребро"; variable = h; min = 1; max = 6; step = 0.1; default = 3.5 }

string info = "";
float n = 5; float R = 2.2; float ep = 0.25; float h = 3.5; float e0 = 1; float e1 = 1; float e2 = 1; float e3 = 1; float e4 = 1; float e5 = 1; float e6 = 1; float e7 = 1;
Function rad(k) { return R * (1 + ep * sin(2.4 * k + 1)); }
Function qx(k) { return rad(k) * cos(6.283185 * k / n); }
Function qz(k) { return rad(k) * sin(6.283185 * k / n); }
Function put(P, Q, k) {
  P.pos.x = qx(k); P.pos.y = -h / 2; P.pos.z = qz(k);
  Q.pos.x = qx(k); Q.pos.y = h / 2; Q.pos.z = qz(k);
}
Function tri(k) { return (qx(k) * qz(k + 1) - qx(k + 1) * qz(k)) / 2; }
Function area() { float s = 0; repeat (n) { s = s + tri(i); } return abs(s); }
Function per() { float s = 0; repeat (n) { s = s + sqrt(pow(qx(i + 1) - qx(i), 2) + pow(qz(i + 1) - qz(i), 2)); } return s; }
Function name(m) {
  if (m == 3) { return "треугольная"; } if (m == 4) { return "четырёхугольная"; } if (m == 5) { return "пятиугольная"; }
  if (m == 6) { return "шестиугольная"; } if (m == 7) { return "семиугольная"; } return "восьмиугольная";
}

Update {
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
  O.pos.x = 0; O.pos.y = -h / 2; O.pos.z = 0;
  float so = area();
  info = "**Объём прямой призмы** равен произведению площади основания на высоту: **V = S_осн · h**. Боковые рёбра перпендикулярны основаниям, поэтому высота совпадает с длиной бокового ребра: h = l = " + format(h, 2) + ".\n\n";
  info = info + "Основание — " + format(n, 0) + "-угольник, разбитый на " + format(n, 0) + " треугольников с общей вершиной O: S_осн = ";
  repeat (n) { if (i > 0) { info = info + " + "; } info = info + format(abs(tri(i)), 2); }
  info = info + " = " + format(so, 2) + ".\n\n";
  info = info + "V = " + format(so, 2) + " · " + format(h, 2) + " = **" + format(so * h, 2) + "**. Боковая поверхность: S_бок = P · h = " + format(per(), 2) + " · " + format(h, 2) + " = " + format(per() * h, 2) + ".";
}
]
