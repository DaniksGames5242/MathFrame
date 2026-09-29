[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.25;

new Point3D { name = "A0"; pos = (0, 0, 0); dynamic = false; collision = false; active = pa0 }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; active = pa1 }
new Point3D { name = "A2"; pos = (0, 0, 0); dynamic = false; collision = false; active = pa2 }
new Point3D { name = "A3"; pos = (0, 0, 0); dynamic = false; collision = false; active = pa3 }
new Point3D { name = "A4"; pos = (0, 0, 0); dynamic = false; collision = false; active = pa4 }
new Point3D { name = "A5"; pos = (0, 0, 0); dynamic = false; collision = false; active = pa5 }
new Point3D { name = "A6"; pos = (0, 0, 0); dynamic = false; collision = false; active = pa6 }
new Point3D { name = "A7"; pos = (0, 0, 0); dynamic = false; collision = false; active = pa7 }
new Point3D { name = "B0"; pos = (0, 0, 0); dynamic = false; collision = false; active = true }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; active = pb1 }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; active = pb2 }
new Point3D { name = "B3"; pos = (0, 0, 0); dynamic = false; collision = false; active = pb3 }
new Point3D { name = "B4"; pos = (0, 0, 0); dynamic = false; collision = false; active = pb4 }
new Point3D { name = "B5"; pos = (0, 0, 0); dynamic = false; collision = false; active = pb5 }
new Point3D { name = "B6"; pos = (0, 0, 0); dynamic = false; collision = false; active = pb6 }
new Point3D { name = "B7"; pos = (0, 0, 0); dynamic = false; collision = false; active = pb7 }
new Point3D { name = "C0"; pos = (0, 0, 0); dynamic = false; collision = false; active = pc }
new Point3D { name = "X"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Y"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "U"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "V"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "a0"; pos = (A0, A1); interact = false; thickness = 3; color = #3b82f6; active = la0 }
new Line3D { name = "a1"; pos = (A1, A2); interact = false; thickness = 3; color = #3b82f6; active = la1 }
new Line3D { name = "a2"; pos = (A2, A3); interact = false; thickness = 3; color = #3b82f6; active = la2 }
new Line3D { name = "a3"; pos = (A3, A4); interact = false; thickness = 3; color = #3b82f6; active = la3 }
new Line3D { name = "a4"; pos = (A4, A5); interact = false; thickness = 3; color = #3b82f6; active = la4 }
new Line3D { name = "a5"; pos = (A5, A6); interact = false; thickness = 3; color = #3b82f6; active = la5 }
new Line3D { name = "a6"; pos = (A6, A7); interact = false; thickness = 3; color = #3b82f6; active = la6 }
new Line3D { name = "ac"; pos = (X, Y); interact = false; thickness = 3; color = #3b82f6; active = true }
new Line3D { name = "b0"; pos = (B0, B1); interact = false; thickness = 3; color = #f59e0b; active = lb0 }
new Line3D { name = "b1"; pos = (B1, B2); interact = false; thickness = 3; color = #f59e0b; active = lb1 }
new Line3D { name = "b2"; pos = (B2, B3); interact = false; thickness = 3; color = #f59e0b; active = lb2 }
new Line3D { name = "b3"; pos = (B3, B4); interact = false; thickness = 3; color = #f59e0b; active = lb3 }
new Line3D { name = "b4"; pos = (B4, B5); interact = false; thickness = 3; color = #f59e0b; active = lb4 }
new Line3D { name = "b5"; pos = (B5, B6); interact = false; thickness = 3; color = #f59e0b; active = lb5 }
new Line3D { name = "b6"; pos = (B6, B7); interact = false; thickness = 3; color = #f59e0b; active = lb6 }
new Line3D { name = "bc"; pos = (U, V); interact = false; thickness = 3; color = #f59e0b; active = pk1 }
new Line3D { name = "l0"; pos = (A0, B0); interact = false; thickness = 2; active = lv0 }
new Line3D { name = "l1"; pos = (A1, B1); interact = false; thickness = 2; active = lv1 }
new Line3D { name = "l2"; pos = (A2, B2); interact = false; thickness = 2; active = lv2 }
new Line3D { name = "l3"; pos = (A3, B3); interact = false; thickness = 2; active = lv3 }
new Line3D { name = "l4"; pos = (A4, B4); interact = false; thickness = 2; active = lv4 }
new Line3D { name = "l5"; pos = (A5, B5); interact = false; thickness = 2; active = lv5 }
new Line3D { name = "l6"; pos = (A6, B6); interact = false; thickness = 2; active = lv6 }
new Line3D { name = "l7"; pos = (A7, B7); interact = false; thickness = 2; active = lv7 }
new Line3D { name = "m0"; pos = (A0, C0); interact = false; thickness = 2; active = lm0 }
new Line3D { name = "m1"; pos = (A1, C0); interact = false; thickness = 2; active = lm1 }
new Line3D { name = "m2"; pos = (A2, C0); interact = false; thickness = 2; active = lm2 }
new Line3D { name = "m3"; pos = (A3, C0); interact = false; thickness = 2; active = lm3 }
new Line3D { name = "m4"; pos = (A4, C0); interact = false; thickness = 2; active = lm4 }
new Line3D { name = "m5"; pos = (A5, C0); interact = false; thickness = 2; active = lm5 }
new Line3D { name = "m6"; pos = (A6, C0); interact = false; thickness = 2; active = lm6 }
new Line3D { name = "m7"; pos = (A7, C0); interact = false; thickness = 2; active = lm7 }

new UI { name = "sK"; type = slider; label = "тело: 1 — призма, 2 — пирамида, 3 — бипирамида"; variable = kind; min = 1; max = 3; step = 1; default = 1 }
new UI { name = "sN"; type = slider; label = "число сторон основания n"; variable = n; min = 3; max = 8; step = 1; default = 5 }
new UI { name = "sH"; type = slider; label = "высота h"; variable = h; min = 2; max = 6; step = 0.1; default = 4 }
new UI { name = "sR"; type = slider; label = "размер основания"; variable = R; min = 1.5; max = 3.5; step = 0.1; default = 2.6 }

float kind = 1; float n = 5; float h = 4; float R = 2.6; string info = "";
bool pa0 = false; bool pa1 = false; bool pa2 = false; bool pa3 = false; bool pa4 = false; bool pa5 = false; bool pa6 = false; bool pa7 = false; bool pb1 = false; bool pb2 = false; bool pb3 = false; bool pb4 = false; bool pb5 = false; bool pb6 = false; bool pb7 = false; bool pc = false; bool la0 = false; bool la1 = false; bool la2 = false; bool la3 = false; bool la4 = false; bool la5 = false; bool la6 = false; bool lb0 = false; bool lb1 = false; bool lb2 = false; bool lb3 = false; bool lb4 = false; bool lb5 = false; bool lb6 = false; bool lv0 = false; bool lv1 = false; bool lv2 = false; bool lv3 = false; bool lv4 = false; bool lv5 = false; bool lv6 = false; bool lv7 = false; bool lm0 = false; bool lm1 = false; bool lm2 = false; bool lm3 = false; bool lm4 = false; bool lm5 = false; bool lm6 = false; bool lm7 = false; bool pk1 = true;

Function name(k) { if (k < 1.5) { return "призма"; } if (k < 2.5) { return "пирамида"; } return "бипирамида"; }
Function num(x) { if (x < 0) { return "−" + format(-x, 0); } return format(x, 0); }
Function put(P, k, y) { P.pos.x = R * cos(6.283185 * k / n); P.pos.y = y; P.pos.z = R * sin(6.283185 * k / n); }
Function top(P, y) { P.pos.x = 0; P.pos.y = y; P.pos.z = 0; }

Update {
  float o1 = round(n); n = o1; float o2 = round(kind); kind = o2;
  float ya = -h / 2; if (kind > 2.5) { ya = 0; }
  put(A0, 0, ya); put(A1, 1, ya); put(A2, 2, ya); put(A3, 3, ya); put(A4, 4, ya); put(A5, 5, ya); put(A6, 6, ya); put(A7, 7, ya);
  put(X, n - 1, ya); put(Y, 0, ya);
  if (kind < 1.5) {
    put(B0, 0, h / 2); put(B1, 1, h / 2); put(B2, 2, h / 2); put(B3, 3, h / 2); put(B4, 4, h / 2); put(B5, 5, h / 2); put(B6, 6, h / 2); put(B7, 7, h / 2);
    put(U, n - 1, h / 2); put(V, 0, h / 2);
  } else {
    top(B0, h / 2); top(B1, h / 2); top(B2, h / 2); top(B3, h / 2); top(B4, h / 2); top(B5, h / 2); top(B6, h / 2); top(B7, h / 2);
    top(U, h / 2); top(V, h / 2);
  }
  top(C0, -h / 2);
  pa0 = n > 0.5; pa1 = n > 1.5; pa2 = n > 2.5; pa3 = n > 3.5; pa4 = n > 4.5; pa5 = n > 5.5; pa6 = n > 6.5; pa7 = n > 7.5; pb1 = kind < 1.5 && n > 1.5; pb2 = kind < 1.5 && n > 2.5; pb3 = kind < 1.5 && n > 3.5; pb4 = kind < 1.5 && n > 4.5; pb5 = kind < 1.5 && n > 5.5; pb6 = kind < 1.5 && n > 6.5; pb7 = kind < 1.5 && n > 7.5; pc = kind > 2.5; la0 = n > 0.5 + 1; la1 = n > 1.5 + 1; la2 = n > 2.5 + 1; la3 = n > 3.5 + 1; la4 = n > 4.5 + 1; la5 = n > 5.5 + 1; la6 = n > 6.5 + 1; lb0 = kind < 1.5 && n > 0.5 + 1; lb1 = kind < 1.5 && n > 1.5 + 1; lb2 = kind < 1.5 && n > 2.5 + 1; lb3 = kind < 1.5 && n > 3.5 + 1; lb4 = kind < 1.5 && n > 4.5 + 1; lb5 = kind < 1.5 && n > 5.5 + 1; lb6 = kind < 1.5 && n > 6.5 + 1; lv0 = n > 0.5; lv1 = n > 1.5; lv2 = n > 2.5; lv3 = n > 3.5; lv4 = n > 4.5; lv5 = n > 5.5; lv6 = n > 6.5; lv7 = n > 7.5; lm0 = kind > 2.5 && n > 0.5; lm1 = kind > 2.5 && n > 1.5; lm2 = kind > 2.5 && n > 2.5; lm3 = kind > 2.5 && n > 3.5; lm4 = kind > 2.5 && n > 4.5; lm5 = kind > 2.5 && n > 5.5; lm6 = kind > 2.5 && n > 6.5; lm7 = kind > 2.5 && n > 7.5; pk1 = kind < 1.5;
  float vv = 2 * n; float ee = 3 * n; float ff = n + 2;
  if (kind > 1.5 && kind < 2.5) { vv = n + 1; ee = 2 * n; ff = n + 1; }
  if (kind > 2.5) { vv = n + 2; ee = 3 * n; ff = 2 * n; }
  info = "**Теорема Эйлера:** у всякого выпуклого многогранника число вершин В, рёбер Р и граней Г связаны равенством **В − Р + Г = 2**.\n\n";
  info = info + "Перед вами " + name(kind) + " с основанием — " + format(n, 0) + "-угольником. ";
  if (kind < 1.5) { info = info + "Вершин: 2·" + format(n, 0) + " = " + format(vv, 0) + ", рёбер: 3·" + format(n, 0) + " = " + format(ee, 0) + " (по " + format(n, 0) + " в каждом основании и " + format(n, 0) + " боковых), граней: " + format(n, 0) + " + 2 = " + format(ff, 0) + "."; }
  if (kind > 1.5 && kind < 2.5) { info = info + "Вершин: " + format(n, 0) + " + 1 = " + format(vv, 0) + ", рёбер: 2·" + format(n, 0) + " = " + format(ee, 0) + " (" + format(n, 0) + " в основании и " + format(n, 0) + " боковых), граней: " + format(n, 0) + " боковых + основание = " + format(ff, 0) + "."; }
  if (kind > 2.5) { info = info + "Вершин: " + format(n, 0) + " + 2 = " + format(vv, 0) + ", рёбер: 3·" + format(n, 0) + " = " + format(ee, 0) + " (" + format(n, 0) + " «экваториальных» и 2·" + format(n, 0) + " боковых), граней: 2·" + format(n, 0) + " = " + format(ff, 0) + "."; }
  info = info + "\n\nВ − Р + Г = " + format(vv, 0) + " − " + format(ee, 0) + " + " + format(ff, 0) + " = **" + format(vv - ee + ff, 0) + "**. Меняя число сторон основания и вид тела, В, Р и Г меняются, а их комбинация остаётся равной двум.";
}
]
