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
new Point3D { name = "G0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "G1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "G2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "G3"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "G4"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "G5"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "G6"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "G7"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "G8"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Line3D { name = "g0"; pos = (G0, G1); interact = false; thickness = 5; color = #f59e0b; active = gf0 }
new Line3D { name = "g1"; pos = (G1, G2); interact = false; thickness = 5; color = #f59e0b; active = gf1 }
new Line3D { name = "g2"; pos = (G2, G3); interact = false; thickness = 5; color = #f59e0b; active = gf2 }
new Line3D { name = "g3"; pos = (G3, G4); interact = false; thickness = 5; color = #f59e0b; active = gf3 }
new Line3D { name = "g4"; pos = (G4, G5); interact = false; thickness = 5; color = #f59e0b; active = gf4 }
new Line3D { name = "g5"; pos = (G5, G6); interact = false; thickness = 5; color = #f59e0b; active = gf5 }
new Line3D { name = "g6"; pos = (G6, G7); interact = false; thickness = 5; color = #f59e0b; active = gf6 }
new Line3D { name = "g7"; pos = (G7, G8); interact = false; thickness = 5; color = #f59e0b; active = gf7 }

new UI { name = "s_n"; type = slider; label = "число сторон основания n"; variable = n; min = 3; max = 8; step = 1; default = 5 }
new UI { name = "s_h"; type = slider; label = "высота H"; variable = hh; min = 2; max = 5; step = 0.1; default = 4 }
new UI { name = "s_d"; type = slider; label = "смещение вершины от оси"; variable = d; min = 0; max = 2; step = 0.05; default = 0.8 }
new UI { name = "s_psi"; type = slider; label = "направление смещения, °"; variable = psi; min = 0; max = 360; step = 1; default = 40 }
new UI { name = "s_kf"; type = slider; label = "выделить: 0 — основание, 1…n — грань"; variable = kf; min = 0; max = n; step = 1; default = 0 }

string info = "";
float n = 5; float R = 2.4; float hh = 4; float d = 0.8; float psi = 40; float kf = 0; float gm = 5; float gf0 = 1; float gf1 = 1; float gf2 = 1; float gf3 = 1; float gf4 = 1; float gf5 = 0; float gf6 = 0; float gf7 = 0;
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

Update {
  n = round(n);
  ax = d * cos(radians(psi)); az = d * sin(radians(psi));
  put(A1, 0); put(A2, 1); put(A3, 2); put(A4, 3); put(A5, 4); put(A6, 5); put(A7, 6); put(A8, 7);
  put(X, n - 1); put(Y, 0); apex(S);
  float k = min(kf, n);
  if (k < 0.5) { gm = n; put(G0, 0); put(G1, 1); put(G2, 2); put(G3, 3); put(G4, 4); put(G5, 5); put(G6, 6); put(G7, 7); put(G8, 8); }
  else { gm = 3; apex(G0); put(G1, k - 1); put(G2, k); apex(G3); }
  gf0 = 0; if (0 < gm) { gf0 = 1; } gf1 = 0; if (1 < gm) { gf1 = 1; } gf2 = 0; if (2 < gm) { gf2 = 1; } gf3 = 0; if (3 < gm) { gf3 = 1; } gf4 = 0; if (4 < gm) { gf4 = 1; } gf5 = 0; if (5 < gm) { gf5 = 1; } gf6 = 0; if (6 < gm) { gf6 = 1; } gf7 = 0; if (7 < gm) { gf7 = 1; }
  float so = sbase(); float sl = lat(); float a = side();
  if (k < 0.5) { info = "**Основание** — правильный " + format(n, 0) + "-угольник со стороной a = " + format(a, 2) + ", S_осн = ½·n·R²·sin(2π/n) = **" + format(so, 2) + "**."; }
  else { info = "**Грань № " + format(k, 0) + "** — треугольник, площадь ½·a·h = **" + format(face(k - 1), 2) + "**."; }
  info = info + "

**Полная поверхность** = основание + боковые грани:
S_полн = S_бок + S_осн = " + format(sl, 2) + " + " + format(so, 2) + " = **" + format(sl + so, 2) + "**.

";
  info = info + "Основание составляет " + format(100 * so / (sl + so), 1) + " % полной поверхности. Площадь основания определяется только многоугольником, а боковая поверхность зависит и от положения вершины: при смещении на " + format(d, 2) + " она равна " + format(sl, 2);
  if (d > 0.005) { info = info + " против " + format(n * a * sqrt(hh * hh + R * R * cos(3.141593 / n) * cos(3.141593 / n)) / 2, 2) + " у правильной пирамиды."; } else { info = info + " (пирамида правильная)."; }
}
]
