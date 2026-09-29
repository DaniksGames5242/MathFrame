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
new Point3D { name = "Q0"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 0.5}
new Point3D { name = "Q1"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 1.5}
new Point3D { name = "Q2"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 2.5}
new Point3D { name = "Q3"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 3.5}
new Point3D { name = "Q4"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 4.5}
new Point3D { name = "Q5"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 5.5}
new Point3D { name = "Q6"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 6.5}
new Point3D { name = "Q7"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 7.5}
new Point3D { name = "QX"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Point3D { name = "QY"; pos = (0, 0, 0); dynamic = false; collision = false; active = false}
new Line3D { name = "q0"; pos = (Q0, Q1); interact = false; thickness = 4; color = #f59e0b; active = n > 1.5 }
new Line3D { name = "q1"; pos = (Q1, Q2); interact = false; thickness = 4; color = #f59e0b; active = n > 2.5 }
new Line3D { name = "q2"; pos = (Q2, Q3); interact = false; thickness = 4; color = #f59e0b; active = n > 3.5 }
new Line3D { name = "q3"; pos = (Q3, Q4); interact = false; thickness = 4; color = #f59e0b; active = n > 4.5 }
new Line3D { name = "q4"; pos = (Q4, Q5); interact = false; thickness = 4; color = #f59e0b; active = n > 5.5 }
new Line3D { name = "q5"; pos = (Q5, Q6); interact = false; thickness = 4; color = #f59e0b; active = n > 6.5 }
new Line3D { name = "q6"; pos = (Q6, Q7); interact = false; thickness = 4; color = #f59e0b; active = n > 7.5 }
new Line3D { name = "qc"; pos = (QX, QY); interact = false; thickness = 4; color = #f59e0b }
new Line3D { name = "l0"; pos = (A1, Q0); interact = false; thickness = 3; active = n > 0.5 }
new Line3D { name = "l1"; pos = (A2, Q1); interact = false; thickness = 3; active = n > 1.5 }
new Line3D { name = "l2"; pos = (A3, Q2); interact = false; thickness = 3; active = n > 2.5 }
new Line3D { name = "l3"; pos = (A4, Q3); interact = false; thickness = 3; active = n > 3.5 }
new Line3D { name = "l4"; pos = (A5, Q4); interact = false; thickness = 3; active = n > 4.5 }
new Line3D { name = "l5"; pos = (A6, Q5); interact = false; thickness = 3; active = n > 5.5 }
new Line3D { name = "l6"; pos = (A7, Q6); interact = false; thickness = 3; active = n > 6.5 }
new Line3D { name = "l7"; pos = (A8, Q7); interact = false; thickness = 3; active = n > 7.5 }
new Line3D { name = "m0"; pos = (Q0, S); interact = false; thickness = 1; active = n > 0.5 }
new Line3D { name = "m1"; pos = (Q1, S); interact = false; thickness = 1; active = n > 1.5 }
new Line3D { name = "m2"; pos = (Q2, S); interact = false; thickness = 1; active = n > 2.5 }
new Line3D { name = "m3"; pos = (Q3, S); interact = false; thickness = 1; active = n > 3.5 }
new Line3D { name = "m4"; pos = (Q4, S); interact = false; thickness = 1; active = n > 4.5 }
new Line3D { name = "m5"; pos = (Q5, S); interact = false; thickness = 1; active = n > 5.5 }
new Line3D { name = "m6"; pos = (Q6, S); interact = false; thickness = 1; active = n > 6.5 }
new Line3D { name = "m7"; pos = (Q7, S); interact = false; thickness = 1; active = n > 7.5 }

new UI { name = "s_n"; type = slider; label = "число сторон основания n"; variable = n; min = 3; max = 8; step = 1; default = 4 }
new UI { name = "s_h"; type = slider; label = "высота полной пирамиды H"; variable = hh; min = 3; max = 6; step = 0.1; default = 5 }
new UI { name = "s_d"; type = slider; label = "смещение вершины параллельно основанию"; variable = d; min = 0; max = 2; step = 0.05; default = 0 }
new UI { name = "s_psi"; type = slider; label = "направление смещения, °"; variable = psi; min = 0; max = 360; step = 1; default = 40 }
new UI { name = "s_s"; type = slider; label = "высота усечённой части h / H"; variable = s; min = 0.1; max = 0.9; step = 0.01; default = 0.6 }

string info = "";
float n = 4; float R = 2.4; float hh = 5; float d = 0; float psi = 40; float s = 0.6;
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

Update {
  n = round(n);
  ax = d * cos(radians(psi)); az = d * sin(radians(psi));
  put(A1, 0); put(A2, 1); put(A3, 2); put(A4, 3); put(A5, 4); put(A6, 5); put(A7, 6); put(A8, 7);
  put(X, n - 1); put(Y, 0); apex(S);
  sec(Q0, 0); sec(Q1, 1); sec(Q2, 2); sec(Q3, 3); sec(Q4, 4); sec(Q5, 5); sec(Q6, 6); sec(Q7, 7);
  sec(QX, n - 1); sec(QY, 0);
  float s1 = sbase(); float k = 1 - s; float s2 = k * k * s1; float h = s * hh;
  float v = h / 3 * (s1 + s2 + sqrt(s1 * s2));
  float vf = s1 * hh / 3; float vs = s2 * (hh - h) / 3;
  info = "**Усечённая пирамида** получена сечением плоскостью, параллельной основанию, на высоте h = " + format(h, 2) + ". Верхнее основание (жёлтое) подобно нижнему с коэффициентом k = " + format(k, 2) + ", боковые грани — трапеции.

";
  info = info + "Площади оснований: S₁ = " + format(s1, 2) + ", S₂ = k²·S₁ = " + format(s2, 2) + ", √(S₁S₂) = " + format(sqrt(s1 * s2), 2) + ".

";
  info = info + "**Объём:** V = h/3·(S₁ + S₂ + √(S₁S₂)) = " + format(h, 2) + "/3·" + format(s1 + s2 + sqrt(s1 * s2), 2) + " = **" + format(v, 2) + "**.

";
  info = info + "Проверка вычитанием: полная пирамида ⅓·S₁·H = " + format(vf, 2) + " минус достроенная верхняя ⅓·S₂·(H − h) = " + format(vs, 2) + " даёт " + format(vf - vs, 2) + ".";
}
]
