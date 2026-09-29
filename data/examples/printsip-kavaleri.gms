[
description = "{info}"

field width = 18; field height = 10; field depth = 10;
show grid = false; show axes = false;
camera start rot = (-30, 66);
camera start zoom = 1.15;

// Слева прямой параллелепипед a×b, справа тело того же объёма: сечение на каждом уровне — прямоугольник (a·k)×(b/k),
// повёрнутый и сдвинутый; k = 1 + m·t растёт с высотой t ∈ [0; 1]. Площадь сечения всюду равна ab.
new Point3D { name = "B0"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "T0"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "W0"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "U0"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "S0"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
new Point3D { name = "Z0"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "T1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "W1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "U1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "S1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
new Point3D { name = "Z1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "T2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "W2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "U2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "S2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
new Point3D { name = "Z2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
new Point3D { name = "B3"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "T3"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "W3"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "U3"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "S3"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
new Point3D { name = "Z3"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
new Line3D { name = "b0"; pos = (B0, B1); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "t0"; pos = (T0, T1); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "v0"; pos = (B0, T0); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "w0"; pos = (W0, W1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "u0"; pos = (U0, U1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "s0"; pos = (S0, S1); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "z0"; pos = (Z0, Z1); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "b1"; pos = (B1, B2); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "t1"; pos = (T1, T2); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "v1"; pos = (B1, T1); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "w1"; pos = (W1, W2); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "u1"; pos = (U1, U2); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "s1"; pos = (S1, S2); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "z1"; pos = (Z1, Z2); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "b2"; pos = (B2, B3); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "t2"; pos = (T2, T3); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "v2"; pos = (B2, T2); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "w2"; pos = (W2, W3); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "u2"; pos = (U2, U3); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "s2"; pos = (S2, S3); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "z2"; pos = (Z2, Z3); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "b3"; pos = (B3, B0); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "t3"; pos = (T3, T0); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "v3"; pos = (B3, T3); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "w3"; pos = (W3, W0); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "u3"; pos = (U3, U0); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "s3"; pos = (S3, S0); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "z3"; pos = (Z3, Z0); interact = false; thickness = 4; color = #22c55e }
new Curve3D { name = "c0"; type = parametric; x = "4.5 + sh * t + (-1 * a / 2) * (1 + m * t) * cos(pr * t) - (-1 * b / 2) / (1 + m * t) * sin(pr * t)"; y = "h * (t - 0.5)"; z = "(-1 * a / 2) * (1 + m * t) * sin(pr * t) + (-1 * b / 2) / (1 + m * t) * cos(pr * t)"; segments = 40; color = #f59e0b; thickness = 3 }
new Curve3D { name = "c1"; type = parametric; x = "4.5 + sh * t + (1 * a / 2) * (1 + m * t) * cos(pr * t) - (-1 * b / 2) / (1 + m * t) * sin(pr * t)"; y = "h * (t - 0.5)"; z = "(1 * a / 2) * (1 + m * t) * sin(pr * t) + (-1 * b / 2) / (1 + m * t) * cos(pr * t)"; segments = 40; color = #f59e0b; thickness = 3 }
new Curve3D { name = "c2"; type = parametric; x = "4.5 + sh * t + (1 * a / 2) * (1 + m * t) * cos(pr * t) - (1 * b / 2) / (1 + m * t) * sin(pr * t)"; y = "h * (t - 0.5)"; z = "(1 * a / 2) * (1 + m * t) * sin(pr * t) + (1 * b / 2) / (1 + m * t) * cos(pr * t)"; segments = 40; color = #f59e0b; thickness = 3 }
new Curve3D { name = "c3"; type = parametric; x = "4.5 + sh * t + (-1 * a / 2) * (1 + m * t) * cos(pr * t) - (1 * b / 2) / (1 + m * t) * sin(pr * t)"; y = "h * (t - 0.5)"; z = "(-1 * a / 2) * (1 + m * t) * sin(pr * t) + (1 * b / 2) / (1 + m * t) * cos(pr * t)"; segments = 40; color = #f59e0b; thickness = 3 }

new UI { type = slider; label = "высота h"; variable = h; min = 2; max = 6; step = 0.5; default = 4 }
new UI { type = slider; label = "уровень сечения"; variable = lv; min = 0; max = 1; step = 0.05; default = 0.4 }
new UI { type = slider; label = "a"; variable = a; min = 1.5; max = 3; step = 0.5; default = 3 }
new UI { type = slider; label = "b"; variable = b; min = 1; max = 2.5; step = 0.5; default = 2 }
new UI { type = slider; label = "растяжение m"; variable = m; min = 0; max = 0.6; step = 0.05; default = 0.4 }
new UI { type = slider; label = "поворот сечений, °"; variable = phi; min = 0; max = 90; step = 5; default = 40 }
new UI { type = slider; label = "сдвиг верха"; variable = sh; min = 0; max = 1.5; step = 0.25; default = 1 }

string info = "";
float h = 4; float lv = 0.4; float a = 3; float b = 2; float m = 0.4; float phi = 40; float sh = 1; float pr = 0;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function quad(P, Q, R, S) { return 0.5 * abs((P.pos.x * Q.pos.z - Q.pos.x * P.pos.z) + (Q.pos.x * R.pos.z - R.pos.x * Q.pos.z) + (R.pos.x * S.pos.z - S.pos.x * R.pos.z) + (S.pos.x * P.pos.z - P.pos.x * S.pos.z)); }

Update {
  pr = phi * pi / 180;
  B0.pos.x = -4.5 + -1 * a / 2; B0.pos.y = -h / 2; B0.pos.z = -1 * b / 2;
  T0.pos.x = B0.pos.x; T0.pos.y = h / 2; T0.pos.z = B0.pos.z;
  S0.pos.x = B0.pos.x; S0.pos.y = h * (lv - 0.5); S0.pos.z = B0.pos.z;
  float kW0 = 1 + m * 0;
  W0.pos.x = 4.5 + sh * 0 + (-1 * a / 2) * kW0 * cos(pr * 0) - (-1 * b / 2) / kW0 * sin(pr * 0); W0.pos.y = h * (0 - 0.5); W0.pos.z = (-1 * a / 2) * kW0 * sin(pr * 0) + (-1 * b / 2) / kW0 * cos(pr * 0);
  float kU0 = 1 + m * 1;
  U0.pos.x = 4.5 + sh * 1 + (-1 * a / 2) * kU0 * cos(pr * 1) - (-1 * b / 2) / kU0 * sin(pr * 1); U0.pos.y = h * (1 - 0.5); U0.pos.z = (-1 * a / 2) * kU0 * sin(pr * 1) + (-1 * b / 2) / kU0 * cos(pr * 1);
  float kZ0 = 1 + m * lv;
  Z0.pos.x = 4.5 + sh * lv + (-1 * a / 2) * kZ0 * cos(pr * lv) - (-1 * b / 2) / kZ0 * sin(pr * lv); Z0.pos.y = h * (lv - 0.5); Z0.pos.z = (-1 * a / 2) * kZ0 * sin(pr * lv) + (-1 * b / 2) / kZ0 * cos(pr * lv);
  B1.pos.x = -4.5 + 1 * a / 2; B1.pos.y = -h / 2; B1.pos.z = -1 * b / 2;
  T1.pos.x = B1.pos.x; T1.pos.y = h / 2; T1.pos.z = B1.pos.z;
  S1.pos.x = B1.pos.x; S1.pos.y = h * (lv - 0.5); S1.pos.z = B1.pos.z;
  float kW1 = 1 + m * 0;
  W1.pos.x = 4.5 + sh * 0 + (1 * a / 2) * kW1 * cos(pr * 0) - (-1 * b / 2) / kW1 * sin(pr * 0); W1.pos.y = h * (0 - 0.5); W1.pos.z = (1 * a / 2) * kW1 * sin(pr * 0) + (-1 * b / 2) / kW1 * cos(pr * 0);
  float kU1 = 1 + m * 1;
  U1.pos.x = 4.5 + sh * 1 + (1 * a / 2) * kU1 * cos(pr * 1) - (-1 * b / 2) / kU1 * sin(pr * 1); U1.pos.y = h * (1 - 0.5); U1.pos.z = (1 * a / 2) * kU1 * sin(pr * 1) + (-1 * b / 2) / kU1 * cos(pr * 1);
  float kZ1 = 1 + m * lv;
  Z1.pos.x = 4.5 + sh * lv + (1 * a / 2) * kZ1 * cos(pr * lv) - (-1 * b / 2) / kZ1 * sin(pr * lv); Z1.pos.y = h * (lv - 0.5); Z1.pos.z = (1 * a / 2) * kZ1 * sin(pr * lv) + (-1 * b / 2) / kZ1 * cos(pr * lv);
  B2.pos.x = -4.5 + 1 * a / 2; B2.pos.y = -h / 2; B2.pos.z = 1 * b / 2;
  T2.pos.x = B2.pos.x; T2.pos.y = h / 2; T2.pos.z = B2.pos.z;
  S2.pos.x = B2.pos.x; S2.pos.y = h * (lv - 0.5); S2.pos.z = B2.pos.z;
  float kW2 = 1 + m * 0;
  W2.pos.x = 4.5 + sh * 0 + (1 * a / 2) * kW2 * cos(pr * 0) - (1 * b / 2) / kW2 * sin(pr * 0); W2.pos.y = h * (0 - 0.5); W2.pos.z = (1 * a / 2) * kW2 * sin(pr * 0) + (1 * b / 2) / kW2 * cos(pr * 0);
  float kU2 = 1 + m * 1;
  U2.pos.x = 4.5 + sh * 1 + (1 * a / 2) * kU2 * cos(pr * 1) - (1 * b / 2) / kU2 * sin(pr * 1); U2.pos.y = h * (1 - 0.5); U2.pos.z = (1 * a / 2) * kU2 * sin(pr * 1) + (1 * b / 2) / kU2 * cos(pr * 1);
  float kZ2 = 1 + m * lv;
  Z2.pos.x = 4.5 + sh * lv + (1 * a / 2) * kZ2 * cos(pr * lv) - (1 * b / 2) / kZ2 * sin(pr * lv); Z2.pos.y = h * (lv - 0.5); Z2.pos.z = (1 * a / 2) * kZ2 * sin(pr * lv) + (1 * b / 2) / kZ2 * cos(pr * lv);
  B3.pos.x = -4.5 + -1 * a / 2; B3.pos.y = -h / 2; B3.pos.z = 1 * b / 2;
  T3.pos.x = B3.pos.x; T3.pos.y = h / 2; T3.pos.z = B3.pos.z;
  S3.pos.x = B3.pos.x; S3.pos.y = h * (lv - 0.5); S3.pos.z = B3.pos.z;
  float kW3 = 1 + m * 0;
  W3.pos.x = 4.5 + sh * 0 + (-1 * a / 2) * kW3 * cos(pr * 0) - (1 * b / 2) / kW3 * sin(pr * 0); W3.pos.y = h * (0 - 0.5); W3.pos.z = (-1 * a / 2) * kW3 * sin(pr * 0) + (1 * b / 2) / kW3 * cos(pr * 0);
  float kU3 = 1 + m * 1;
  U3.pos.x = 4.5 + sh * 1 + (-1 * a / 2) * kU3 * cos(pr * 1) - (1 * b / 2) / kU3 * sin(pr * 1); U3.pos.y = h * (1 - 0.5); U3.pos.z = (-1 * a / 2) * kU3 * sin(pr * 1) + (1 * b / 2) / kU3 * cos(pr * 1);
  float kZ3 = 1 + m * lv;
  Z3.pos.x = 4.5 + sh * lv + (-1 * a / 2) * kZ3 * cos(pr * lv) - (1 * b / 2) / kZ3 * sin(pr * lv); Z3.pos.y = h * (lv - 0.5); Z3.pos.z = (-1 * a / 2) * kZ3 * sin(pr * lv) + (1 * b / 2) / kZ3 * cos(pr * lv);
  float s1 = quad(S0, S1, S2, S3); float s2 = quad(Z0, Z1, Z2, Z3); float kk = 1 + m * lv;
  info = "**Принцип Кавальери.** Два тела заключены между параллельными плоскостями на расстоянии h = " + format(h, 1) + ". Если любая плоскость, параллельная им, даёт в обоих телах сечения равной площади, то объёмы тел равны — форма сечений при этом может различаться.\n\n";
  info = info + "Сечение на высоте " + format(h * lv, 2) + " от основания: у параллелепипеда — прямоугольник " + format(a, 1) + " × " + format(b, 1) + ", площадь **S₁ = " + format(s1, 3) + "**; у второго тела — прямоугольник " + format(a * kk, 2) + " × " + format(b / kk, 2) + " (стороны a·k и b/k, k = " + format(kk, 2) + "), площадь **S₂ = " + format(s2, 3) + "**. Площади совпадают на каждом уровне.\n\n";
  info = info + "Значит, объёмы равны: **V₁ = V₂ = a·b·h = " + format(a * b * h, 2) + "**.";
}
]
