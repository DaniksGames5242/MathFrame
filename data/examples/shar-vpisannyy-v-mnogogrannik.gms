[
description = "{info}"

field width = 14; field height = 14; field depth = 14;
show grid = false; show axes = false;
camera start rot = (22, 62);
camera start zoom = 1.6;

// Правильная n-угольная пирамида SABC… с вписанным шаром: центр C равноудалён от всех граней.
draw Surface { name = "ball"; type = parametric; x = "rb * sin(pi * u) * cos(6.283185 * v)"; y = "cy + rb * cos(pi * u)"; z = "rb * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 32; color = #3b82f6; opacity = 0.25 }
new Point3D { name = "S"; pos = (0, 3, 0); dynamic = false; collision = false; size = 0.4; text = true("S") }
new Point3D { name = "C"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("C"); color = #f59e0b }
new Point3D { name = "T1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.35; color = #22c55e }
new Point3D { name = "T2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.35; color = #22c55e }
new Line3D { name = "c1"; pos = (C, T1); interact = false; thickness = 2; color = #22c55e }
new Line3D { name = "c2"; pos = (C, T2); interact = false; thickness = 2; color = #22c55e }
new Point3D { name = "V1"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("A"); active = n > 0 }
new Point3D { name = "V2"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("B"); active = n > 1 }
new Point3D { name = "V3"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("C"); active = n > 2 }
new Point3D { name = "V4"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("D"); active = n > 3 }
new Point3D { name = "V5"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("E"); active = n > 4 }
new Point3D { name = "V6"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("F"); active = n > 5 }
new Point3D { name = "V7"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("G"); active = n > 6 }
new Point3D { name = "V8"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("H"); active = n > 7 }
new Line3D { name = "b1"; pos = (V1, V2); interact = false; thickness = 3; active = n > 0 }
new Line3D { name = "t1"; pos = (S, V1); interact = false; thickness = 3; active = n > 0 }
new Line3D { name = "b2"; pos = (V2, V3); interact = false; thickness = 3; active = n > 1 }
new Line3D { name = "t2"; pos = (S, V2); interact = false; thickness = 3; active = n > 1 }
new Line3D { name = "b3"; pos = (V3, V4); interact = false; thickness = 3; active = n > 2 }
new Line3D { name = "t3"; pos = (S, V3); interact = false; thickness = 3; active = n > 2 }
new Line3D { name = "b4"; pos = (V4, V5); interact = false; thickness = 3; active = n > 3 }
new Line3D { name = "t4"; pos = (S, V4); interact = false; thickness = 3; active = n > 3 }
new Line3D { name = "b5"; pos = (V5, V6); interact = false; thickness = 3; active = n > 4 }
new Line3D { name = "t5"; pos = (S, V5); interact = false; thickness = 3; active = n > 4 }
new Line3D { name = "b6"; pos = (V6, V7); interact = false; thickness = 3; active = n > 5 }
new Line3D { name = "t6"; pos = (S, V6); interact = false; thickness = 3; active = n > 5 }
new Line3D { name = "b7"; pos = (V7, V8); interact = false; thickness = 3; active = n > 6 }
new Line3D { name = "t7"; pos = (S, V7); interact = false; thickness = 3; active = n > 6 }
new Line3D { name = "b8"; pos = (V8, V1); interact = false; thickness = 3; active = n > 7 }
new Line3D { name = "t8"; pos = (S, V8); interact = false; thickness = 3; active = n > 7 }

new UI { type = slider; label = "число сторон основания n"; variable = n; min = 3; max = 8; step = 1; default = 4 }
new UI { type = slider; label = "радиус вписанной окружности основания ρ"; variable = rho; min = 1.5; max = 3.5; step = 0.1; default = 2.5 }
new UI { type = slider; label = "высота H"; variable = H; min = 2; max = 7; step = 0.1; default = 5 }

string info = "";
float n = 4; float rho = 2.5; float H = 5; float rb = 1; float cy = 0;
Function put(V, k, R, y) {
  float kk = k;
  if (kk > n) { kk = 1; }
  V.pos.x = R * cos(2 * pi * (kk - 1) / n); V.pos.y = y; V.pos.z = R * sin(2 * pi * (kk - 1) / n);
}
Update {
  float R0 = rho / cos(pi / n);
  float yb = -H / 2;
  float l = sqrt(rho * rho + H * H);
  rb = rho * H / (rho + l);
  cy = yb + rb;
  put(V1, 1, R0, yb); put(V2, 2, R0, yb); put(V3, 3, R0, yb); put(V4, 4, R0, yb);
  put(V5, 5, R0, yb); put(V6, 6, R0, yb); put(V7, 7, R0, yb); put(V8, 8, R0, yb);
  S.pos.y = H / 2;
  C.pos.y = cy;
  T1.pos.y = yb;
  float ph = pi / n;
  float rad = rb * H / l;
  T2.pos.x = rad * cos(ph); T2.pos.z = rad * sin(ph); T2.pos.y = cy + rb * rho / l;
  float B = n * rho * rho * tan(pi / n);
  float Sl = n * rho * tan(pi / n) * l;
  float V = B * H / 3;
  float dl = rho * (H - rb) / l;
  info = "**Шар, вписанный в многогранник** касается каждой грани, оставаясь внутри него. Здесь — правильная " + format(n, 0) + "-угольная пирамида SABC… с высотой H = " + format(H, 2) + " и радиусом вписанной окружности основания ρ = " + format(rho, 2) + ".\n\n";
  info = info + "**Центр C равноудалён от всех граней.** Расстояние до основания = " + format(rb, 2) + ", до боковой грани = " + format(dl, 2) + " — это радиус шара r = " + format(rb, 2) + " (зелёные отрезки — радиусы в точках касания).\n\n";
  info = info + "**Радиус через объём.** V = " + format(V, 2) + ", S полн = " + format(B + Sl, 2) + ", 3V / S полн = " + format(3 * V / (B + Sl), 2) + " = r. Пирамида разбивается на " + format(n + 1, 0) + " пирамид с вершиной C и высотами r, поэтому V = ⅓ · r · S полн.";
}
]
