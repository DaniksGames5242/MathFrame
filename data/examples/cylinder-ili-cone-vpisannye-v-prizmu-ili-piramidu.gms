[
description = "{info}"

field width = 14; field height = 14; field depth = 14;
show grid = false; show axes = false;
camera start rot = (22, 62);
camera start zoom = 1.6;

// Правильная n-угольная призма с вписанным цилиндром или пирамида с вписанным конусом: основание тела вращения — окружность, вписанная в основание многогранника.
draw Surface { name = "cyl"; type = parametric; x = "rho * cos(6.283185 * v)"; y = "yb + H * u"; z = "rho * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 32; color = #3b82f6; opacity = 0.25; active = mode == 1 }
draw Surface { name = "con"; type = parametric; x = "rho * (1 - u) * cos(6.283185 * v)"; y = "yb + H * u"; z = "rho * (1 - u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 32; color = #f59e0b; opacity = 0.25; active = mode == 2 }
new Point3D { name = "S"; pos = (0, 3, 0); dynamic = false; collision = false; size = 0.4; text = true("S"); active = mode == 2 }
new Point3D { name = "V1"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("A"); active = n > 0 }
new Point3D { name = "W1"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("A′"); active = n > 0 && mode == 1 }
new Point3D { name = "V2"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("B"); active = n > 1 }
new Point3D { name = "W2"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("B′"); active = n > 1 && mode == 1 }
new Point3D { name = "V3"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("C"); active = n > 2 }
new Point3D { name = "W3"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("C′"); active = n > 2 && mode == 1 }
new Point3D { name = "V4"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("D"); active = n > 3 }
new Point3D { name = "W4"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("D′"); active = n > 3 && mode == 1 }
new Point3D { name = "V5"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("E"); active = n > 4 }
new Point3D { name = "W5"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("E′"); active = n > 4 && mode == 1 }
new Point3D { name = "V6"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("F"); active = n > 5 }
new Point3D { name = "W6"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("F′"); active = n > 5 && mode == 1 }
new Point3D { name = "V7"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("G"); active = n > 6 }
new Point3D { name = "W7"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("G′"); active = n > 6 && mode == 1 }
new Point3D { name = "V8"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("H"); active = n > 7 }
new Point3D { name = "W8"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("H′"); active = n > 7 && mode == 1 }
new Line3D { name = "b1"; pos = (V1, V2); interact = false; thickness = 3; active = n > 0 }
new Line3D { name = "u1"; pos = (W1, W2); interact = false; thickness = 3; active = n > 0 && mode == 1 }
new Line3D { name = "s1"; pos = (V1, W1); interact = false; thickness = 3; active = n > 0 && mode == 1 }
new Line3D { name = "t1"; pos = (S, V1); interact = false; thickness = 3; active = n > 0 && mode == 2 }
new Line3D { name = "b2"; pos = (V2, V3); interact = false; thickness = 3; active = n > 1 }
new Line3D { name = "u2"; pos = (W2, W3); interact = false; thickness = 3; active = n > 1 && mode == 1 }
new Line3D { name = "s2"; pos = (V2, W2); interact = false; thickness = 3; active = n > 1 && mode == 1 }
new Line3D { name = "t2"; pos = (S, V2); interact = false; thickness = 3; active = n > 1 && mode == 2 }
new Line3D { name = "b3"; pos = (V3, V4); interact = false; thickness = 3; active = n > 2 }
new Line3D { name = "u3"; pos = (W3, W4); interact = false; thickness = 3; active = n > 2 && mode == 1 }
new Line3D { name = "s3"; pos = (V3, W3); interact = false; thickness = 3; active = n > 2 && mode == 1 }
new Line3D { name = "t3"; pos = (S, V3); interact = false; thickness = 3; active = n > 2 && mode == 2 }
new Line3D { name = "b4"; pos = (V4, V5); interact = false; thickness = 3; active = n > 3 }
new Line3D { name = "u4"; pos = (W4, W5); interact = false; thickness = 3; active = n > 3 && mode == 1 }
new Line3D { name = "s4"; pos = (V4, W4); interact = false; thickness = 3; active = n > 3 && mode == 1 }
new Line3D { name = "t4"; pos = (S, V4); interact = false; thickness = 3; active = n > 3 && mode == 2 }
new Line3D { name = "b5"; pos = (V5, V6); interact = false; thickness = 3; active = n > 4 }
new Line3D { name = "u5"; pos = (W5, W6); interact = false; thickness = 3; active = n > 4 && mode == 1 }
new Line3D { name = "s5"; pos = (V5, W5); interact = false; thickness = 3; active = n > 4 && mode == 1 }
new Line3D { name = "t5"; pos = (S, V5); interact = false; thickness = 3; active = n > 4 && mode == 2 }
new Line3D { name = "b6"; pos = (V6, V7); interact = false; thickness = 3; active = n > 5 }
new Line3D { name = "u6"; pos = (W6, W7); interact = false; thickness = 3; active = n > 5 && mode == 1 }
new Line3D { name = "s6"; pos = (V6, W6); interact = false; thickness = 3; active = n > 5 && mode == 1 }
new Line3D { name = "t6"; pos = (S, V6); interact = false; thickness = 3; active = n > 5 && mode == 2 }
new Line3D { name = "b7"; pos = (V7, V8); interact = false; thickness = 3; active = n > 6 }
new Line3D { name = "u7"; pos = (W7, W8); interact = false; thickness = 3; active = n > 6 && mode == 1 }
new Line3D { name = "s7"; pos = (V7, W7); interact = false; thickness = 3; active = n > 6 && mode == 1 }
new Line3D { name = "t7"; pos = (S, V7); interact = false; thickness = 3; active = n > 6 && mode == 2 }
new Line3D { name = "b8"; pos = (V8, V1); interact = false; thickness = 3; active = n > 7 }
new Line3D { name = "u8"; pos = (W8, W1); interact = false; thickness = 3; active = n > 7 && mode == 1 }
new Line3D { name = "s8"; pos = (V8, W8); interact = false; thickness = 3; active = n > 7 && mode == 1 }
new Line3D { name = "t8"; pos = (S, V8); interact = false; thickness = 3; active = n > 7 && mode == 2 }

new UI { name = "bPr"; type = button; label = "Призма и цилиндр"; action = "mode = 1" }
new UI { name = "bPy"; type = button; label = "Пирамида и конус"; action = "mode = 2" }
new UI { type = slider; label = "число сторон основания n"; variable = n; min = 3; max = 8; step = 1; default = 4 }
new UI { type = slider; label = "радиус вписанной окружности ρ"; variable = rho; min = 1.5; max = 3.5; step = 0.1; default = 2.5 }
new UI { type = slider; label = "высота H"; variable = H; min = 2; max = 8; step = 0.1; default = 5 }

string info = "";
float mode = 1; float n = 4; float rho = 2.5; float H = 5; float yb = -2.5;
Function put(V, k, R, y) {
  float kk = k;
  if (kk > n) { kk = 1; }
  V.pos.x = R * cos(2 * pi * (kk - 1) / n); V.pos.y = y; V.pos.z = R * sin(2 * pi * (kk - 1) / n);
}
Update {
  float R0 = rho / cos(pi / n);
  yb = -H / 2;
  put(V1, 1, R0, yb); put(V2, 2, R0, yb); put(V3, 3, R0, yb); put(V4, 4, R0, yb);
  put(V5, 5, R0, yb); put(V6, 6, R0, yb); put(V7, 7, R0, yb); put(V8, 8, R0, yb);
  put(W1, 1, R0, H / 2); put(W2, 2, R0, H / 2); put(W3, 3, R0, H / 2); put(W4, 4, R0, H / 2);
  put(W5, 5, R0, H / 2); put(W6, 6, R0, H / 2); put(W7, 7, R0, H / 2); put(W8, 8, R0, H / 2);
  S.pos.y = H / 2;
  float B = n * rho * rho * tan(pi / n);
  float k = pi / (n * tan(pi / n));
  if (mode == 1) {
    info = "**Цилиндр, вписанный в призму.** Основания цилиндра вписаны в основания правильной " + format(n, 0) + "-угольной призмы, боковая поверхность касается всех боковых граней. Радиус цилиндра равен радиусу вписанной окружности основания ρ = " + format(rho, 2) + ", высота совпадает с высотой призмы H = " + format(H, 2) + ".\n\n";
    info = info + "**Объёмы.** V цилиндра = πρ²H = " + format(pi * rho * rho * H, 2) + ", V призмы = " + format(B * H, 2) + ". Отношение " + format(k, 3) + " зависит только от n.";
  } else {
    float l = sqrt(rho * rho + H * H);
    info = "**Конус, вписанный в пирамиду.** Вершина конуса — вершина S правильной " + format(n, 0) + "-угольной пирамиды, основание вписано в основание пирамиды, боковая поверхность касается боковых граней вдоль образующих. Радиус основания ρ = " + format(rho, 2) + ", высота H = " + format(H, 2) + ", образующая l = " + format(l, 2) + ".\n\n";
    info = info + "**Объёмы.** V конуса = ⅓πρ²H = " + format(pi * rho * rho * H / 3, 2) + ", V пирамиды = " + format(B * H / 3, 2) + ". Отношение " + format(k, 3) + " — то же, что у цилиндра и призмы с таким основанием.";
  }
}
]
