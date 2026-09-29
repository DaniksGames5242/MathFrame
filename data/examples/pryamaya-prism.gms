[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.25;

new Point3D { name = "B0"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 0.5 }
new Point3D { name = "T0"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 0.5 }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 1.5 }
new Point3D { name = "T1"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 1.5 }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 2.5 }
new Point3D { name = "T2"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 2.5 }
new Point3D { name = "B3"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 3.5 }
new Point3D { name = "T3"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 3.5 }
new Point3D { name = "B4"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 4.5 }
new Point3D { name = "T4"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 4.5 }
new Point3D { name = "B5"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 5.5 }
new Point3D { name = "T5"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 5.5 }
new Point3D { name = "B6"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 6.5 }
new Point3D { name = "T6"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 6.5 }
new Point3D { name = "B7"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 7.5 }
new Point3D { name = "T7"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 7.5 }
new Point3D { name = "X"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Y"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "U"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "V"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "b0"; pos = (B0, B1); interact = false; thickness = 3; color = #3b82f6; active = n > 1.5 }
new Line3D { name = "t0"; pos = (T0, T1); interact = false; thickness = 3; color = #3b82f6; active = n > 1.5 }
new Line3D { name = "b1"; pos = (B1, B2); interact = false; thickness = 3; color = #3b82f6; active = n > 2.5 }
new Line3D { name = "t1"; pos = (T1, T2); interact = false; thickness = 3; color = #3b82f6; active = n > 2.5 }
new Line3D { name = "b2"; pos = (B2, B3); interact = false; thickness = 3; color = #3b82f6; active = n > 3.5 }
new Line3D { name = "t2"; pos = (T2, T3); interact = false; thickness = 3; color = #3b82f6; active = n > 3.5 }
new Line3D { name = "b3"; pos = (B3, B4); interact = false; thickness = 3; color = #3b82f6; active = n > 4.5 }
new Line3D { name = "t3"; pos = (T3, T4); interact = false; thickness = 3; color = #3b82f6; active = n > 4.5 }
new Line3D { name = "b4"; pos = (B4, B5); interact = false; thickness = 3; color = #3b82f6; active = n > 5.5 }
new Line3D { name = "t4"; pos = (T4, T5); interact = false; thickness = 3; color = #3b82f6; active = n > 5.5 }
new Line3D { name = "b5"; pos = (B5, B6); interact = false; thickness = 3; color = #3b82f6; active = n > 6.5 }
new Line3D { name = "t5"; pos = (T5, T6); interact = false; thickness = 3; color = #3b82f6; active = n > 6.5 }
new Line3D { name = "b6"; pos = (B6, B7); interact = false; thickness = 3; color = #3b82f6; active = n > 7.5 }
new Line3D { name = "t6"; pos = (T6, T7); interact = false; thickness = 3; color = #3b82f6; active = n > 7.5 }
new Line3D { name = "bc"; pos = (X, Y); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "tc"; pos = (U, V); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "l0"; pos = (B0, T0); interact = false; thickness = 3; color = #f59e0b; active = n > 0.5 }
new Line3D { name = "l1"; pos = (B1, T1); interact = false; thickness = 3; color = #f59e0b; active = n > 1.5 }
new Line3D { name = "l2"; pos = (B2, T2); interact = false; thickness = 3; color = #f59e0b; active = n > 2.5 }
new Line3D { name = "l3"; pos = (B3, T3); interact = false; thickness = 3; color = #f59e0b; active = n > 3.5 }
new Line3D { name = "l4"; pos = (B4, T4); interact = false; thickness = 3; color = #f59e0b; active = n > 4.5 }
new Line3D { name = "l5"; pos = (B5, T5); interact = false; thickness = 3; color = #f59e0b; active = n > 5.5 }
new Line3D { name = "l6"; pos = (B6, T6); interact = false; thickness = 3; color = #f59e0b; active = n > 6.5 }
new Line3D { name = "l7"; pos = (B7, T7); interact = false; thickness = 3; color = #f59e0b; active = n > 7.5 }
new Angle3D { name = "rt"; type = pointAngle; measure = false; vertex = B0; point1 = T0; point2 = B1; radius = 0.8 }

new UI { name = "s_n"; type = slider; label = "число сторон основания n"; variable = n; min = 3; max = 8; step = 1; default = 5 }
new UI { name = "s_R"; type = slider; label = "размер основания"; variable = R; min = 1.2; max = 2.6; step = 0.1; default = 2.2 }
new UI { name = "s_sx"; type = slider; label = "вытянутость основания"; variable = sx; min = 0.5; max = 1.2; step = 0.05; default = 1 }
new UI { name = "s_h"; type = slider; label = "высота h"; variable = h; min = 2; max = 5; step = 0.1; default = 3.5 }

string info = "";
float n = 5; float R = 2.2; float sx = 1; float h = 3.5;
float dx = 0; float dz = 0;

Function qx(k) { return R * sx * cos(6.283185 * k / n); }
Function qz(k) { return R * sin(6.283185 * k / n); }
Function put(P, Q, k) {
  P.pos.x = qx(k) - dx / 2; P.pos.y = -h / 2; P.pos.z = qz(k) - dz / 2;
  Q.pos.x = P.pos.x + dx; Q.pos.y = h / 2; Q.pos.z = P.pos.z + dz;
}
Function side(k) { return sqrt((qx(k + 1) - qx(k)) * (qx(k + 1) - qx(k)) + (qz(k + 1) - qz(k)) * (qz(k + 1) - qz(k))); }
Function face(k) {
  float ax = qx(k + 1) - qx(k); float az = qz(k + 1) - qz(k);
  float c1 = -az * h; float c2 = az * dx - ax * dz; float c3 = ax * h;
  return sqrt(c1 * c1 + c2 * c2 + c3 * c3);
}
Function cosf(k) {
  float ax = qx(k + 1) - qx(k); float az = qz(k + 1) - qz(k);
  return (ax * dx + az * dz) / (side(k) * sqrt(dx * dx + h * h + dz * dz));
}
Function area() { float s = 0; repeat (n) { s = s + qx(i) * qz(i + 1) - qx(i + 1) * qz(i); } return abs(s) / 2; }
Function per() { float s = 0; repeat (n) { s = s + side(i); } return s; }
Function lat() { float s = 0; repeat (n) { s = s + face(i); } return s; }
Function rects() { float s = 0; repeat (n) { if (abs(cosf(i)) < 0.001) { s = s + 1; } } return s; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function ang(c) { return acos(max(-1, min(1, c))) * 57.29578; }
Function name(m) {
  if (m == 3) { return "треугольная"; } if (m == 4) { return "четырёхугольная"; } if (m == 5) { return "пятиугольная"; }
  if (m == 6) { return "шестиугольная"; } if (m == 7) { return "семиугольная"; } return "восьмиугольная";
}

Update {
  dx = 0; dz = 0;
  float o = round(n); n = o;
  put(B0, T0, 0);
  put(B1, T1, 1);
  put(B2, T2, 2);
  put(B3, T3, 3);
  put(B4, T4, 4);
  put(B5, T5, 5);
  put(B6, T6, 6);
  put(B7, T7, 7);
  put(X, U, n - 1); put(Y, V, 0);
  info = "**Прямая призма:** все " + format(n, 0) + " боковых рёбер перпендикулярны плоскостям оснований, равны между собой и равны высоте **h = " + format(h, 2) + "**.\n\n";
  info = info + "Боковые грани — " + format(n, 0) + " прямоугольников со сторонами (сторона основания) × h; все их углы прямые. Стороны оснований: " + format(side(0), 2) + (n > 1 ? ", " + format(side(1), 2) : "") + ", … Периметр основания P = " + format(per(), 2) + ".\n\n";
  info = info + "Площадь боковой поверхности **P·h = " + format(per() * h, 2) + "**, объём **S·h = " + format(area() * h, 2) + "** (S = " + format(area(), 2) + ").";
}
]
