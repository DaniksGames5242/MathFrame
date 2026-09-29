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
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; }
new Line3D { name = "g0"; pos = (G0, G1); interact = false; thickness = 5; color = #f59e0b }
new Line3D { name = "g1"; pos = (G1, G2); interact = false; thickness = 5; color = #f59e0b }
new Line3D { name = "g2"; pos = (G2, G3); interact = false; thickness = 5; color = #f59e0b }
new Line3D { name = "ap"; pos = (S, M); interact = false; thickness = 4; color = #3b82f6 }

new UI { name = "s_n"; type = slider; label = "число сторон основания n"; variable = n; min = 3; max = 8; step = 1; default = 5 }
new UI { name = "s_h"; type = slider; label = "высота H"; variable = hh; min = 2; max = 5; step = 0.1; default = 4 }
new UI { name = "s_d"; type = slider; label = "смещение вершины от оси"; variable = d; min = 0; max = 2; step = 0.05; default = 0 }
new UI { name = "s_psi"; type = slider; label = "направление смещения, °"; variable = psi; min = 0; max = 360; step = 1; default = 40 }
new UI { name = "s_kf"; type = slider; label = "номер грани"; variable = kf; min = 1; max = n; step = 1; default = 1 }

string info = "";
float n = 5; float R = 2.4; float hh = 4; float d = 0; float psi = 40; float kf = 1;
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
  float k = min(kf, n) - 1;
  apex(G0); put(G1, k); put(G2, k + 1); apex(G3);
  float t = ft(k);
  M.pos.x = qx(k) + t * (qx(k + 1) - qx(k)); M.pos.y = -hh / 2; M.pos.z = qz(k) + t * (qz(k + 1) - qz(k));
  float a = side(); float r = R * cos(3.141593 / n);
  float ha = sqrt(hh * hh + r * r);
  float sr = n * a * ha / 2; float sl = lat();
  info = "**Боковая поверхность** — " + format(n, 0) + " треугольников с общей вершиной. Выделена грань № " + format(k + 1, 0) + ": сторона основания a = " + format(a, 2) + ", апофема hₖ = " + format(apo(k), 2) + " (расстояние от вершины до стороны, синий отрезок), площадь ½·a·hₖ = **" + format(a * apo(k) / 2, 2) + "**.

";
  info = info + "**Аддитивность:** S_бок = ½·Σaᵢhᵢ = **" + format(sl, 2) + "**. Апофемы:";
  repeat (n) { info = info + " h" + sub(i + 1) + " = " + format(apo(i), 2) + ";"; }
  info = info + "

**Правильная пирамида** с тем же основанием и высотой H = " + format(hh, 1) + ": все апофемы равны hₐ = √(H² + r²) = " + format(ha, 2) + ", S_бок = ½·P·hₐ = **" + format(sr, 2) + "**. ";
  if (sl - sr < 0.005) { info = info + "Вершина над центром основания — апофемы равны, суммы совпадают."; }
  else { info = info + "Вершина смещена на " + format(d, 2) + ": апофемы стали разными, а площадь выросла на " + format(sl - sr, 2) + " (" + format(100 * (sl - sr) / sr, 1) + " %) — правильная пирамида даёт наименьшую боковую поверхность."; }
}
]
