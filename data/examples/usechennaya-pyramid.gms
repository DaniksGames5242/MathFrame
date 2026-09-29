[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.8;

new Point3D { name = "B0"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 0.5; }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 1.5; }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 2.5; }
new Point3D { name = "B3"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 3.5; }
new Point3D { name = "B4"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 4.5; }
new Point3D { name = "B5"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 5.5; }
new Point3D { name = "B6"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 6.5; }
new Point3D { name = "B7"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 7.5; }
new Point3D { name = "X"; pos = (0, 0, 0); dynamic = false; collision = false; active = false; }
new Point3D { name = "Y"; pos = (0, 0, 0); dynamic = false; collision = false; active = false; }
new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("S"); }
new Point3D { name = "C0"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 0.5; }
new Point3D { name = "C1"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 1.5; }
new Point3D { name = "C2"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 2.5; }
new Point3D { name = "C3"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 3.5; }
new Point3D { name = "C4"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 4.5; }
new Point3D { name = "C5"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 5.5; }
new Point3D { name = "C6"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 6.5; }
new Point3D { name = "C7"; pos = (0, 0, 0); dynamic = false; collision = false; active = n > 7.5; }
new Point3D { name = "U"; pos = (0, 0, 0); dynamic = false; collision = false; active = false; }
new Point3D { name = "V"; pos = (0, 0, 0); dynamic = false; collision = false; active = false; }
new Line3D { name = "b0"; pos = (B0, B1); interact = false; thickness = 3; active = n > 1.5; color = #3b82f6; }
new Line3D { name = "b1"; pos = (B1, B2); interact = false; thickness = 3; active = n > 2.5; color = #3b82f6; }
new Line3D { name = "b2"; pos = (B2, B3); interact = false; thickness = 3; active = n > 3.5; color = #3b82f6; }
new Line3D { name = "b3"; pos = (B3, B4); interact = false; thickness = 3; active = n > 4.5; color = #3b82f6; }
new Line3D { name = "b4"; pos = (B4, B5); interact = false; thickness = 3; active = n > 5.5; color = #3b82f6; }
new Line3D { name = "b5"; pos = (B5, B6); interact = false; thickness = 3; active = n > 6.5; color = #3b82f6; }
new Line3D { name = "b6"; pos = (B6, B7); interact = false; thickness = 3; active = n > 7.5; color = #3b82f6; }
new Line3D { name = "bc"; pos = (X, Y); interact = false; thickness = 3; color = #3b82f6; }
new Line3D { name = "e0"; pos = (B0, S); interact = false; thickness = 1; active = n > 0.5; }
new Line3D { name = "e1"; pos = (B1, S); interact = false; thickness = 1; active = n > 1.5; }
new Line3D { name = "e2"; pos = (B2, S); interact = false; thickness = 1; active = n > 2.5; }
new Line3D { name = "e3"; pos = (B3, S); interact = false; thickness = 1; active = n > 3.5; }
new Line3D { name = "e4"; pos = (B4, S); interact = false; thickness = 1; active = n > 4.5; }
new Line3D { name = "e5"; pos = (B5, S); interact = false; thickness = 1; active = n > 5.5; }
new Line3D { name = "e6"; pos = (B6, S); interact = false; thickness = 1; active = n > 6.5; }
new Line3D { name = "e7"; pos = (B7, S); interact = false; thickness = 1; active = n > 7.5; }
new Line3D { name = "c0"; pos = (C0, C1); interact = false; thickness = 3; active = n > 1.5; color = #3b82f6; }
new Line3D { name = "c1"; pos = (C1, C2); interact = false; thickness = 3; active = n > 2.5; color = #3b82f6; }
new Line3D { name = "c2"; pos = (C2, C3); interact = false; thickness = 3; active = n > 3.5; color = #3b82f6; }
new Line3D { name = "c3"; pos = (C3, C4); interact = false; thickness = 3; active = n > 4.5; color = #3b82f6; }
new Line3D { name = "c4"; pos = (C4, C5); interact = false; thickness = 3; active = n > 5.5; color = #3b82f6; }
new Line3D { name = "c5"; pos = (C5, C6); interact = false; thickness = 3; active = n > 6.5; color = #3b82f6; }
new Line3D { name = "c6"; pos = (C6, C7); interact = false; thickness = 3; active = n > 7.5; color = #3b82f6; }
new Line3D { name = "cc"; pos = (U, V); interact = false; thickness = 3; color = #3b82f6; }
new Line3D { name = "m0"; pos = (C0, B0); interact = false; thickness = 3; active = n > 0.5; color = #f59e0b; }
new Line3D { name = "m1"; pos = (C1, B1); interact = false; thickness = 3; active = n > 1.5; color = #f59e0b; }
new Line3D { name = "m2"; pos = (C2, B2); interact = false; thickness = 3; active = n > 2.5; color = #f59e0b; }
new Line3D { name = "m3"; pos = (C3, B3); interact = false; thickness = 3; active = n > 3.5; color = #f59e0b; }
new Line3D { name = "m4"; pos = (C4, B4); interact = false; thickness = 3; active = n > 4.5; color = #f59e0b; }
new Line3D { name = "m5"; pos = (C5, B5); interact = false; thickness = 3; active = n > 5.5; color = #f59e0b; }
new Line3D { name = "m6"; pos = (C6, B6); interact = false; thickness = 3; active = n > 6.5; color = #f59e0b; }
new Line3D { name = "m7"; pos = (C7, B7); interact = false; thickness = 3; active = n > 7.5; color = #f59e0b; }

new UI { name = "s_n"; type = slider; label = "число сторон основания n"; variable = n; min = 3; max = 8; step = 1; default = 5 }
new UI { name = "s_R"; type = slider; label = "размер основания"; variable = R; min = 1.2; max = 2.6; step = 0.1; default = 2.2 }
new UI { name = "s_sx"; type = slider; label = "вытянутость основания"; variable = sx; min = 0.6; max = 1.2; step = 0.05; default = 1 }
new UI { name = "s_k0"; type = slider; label = "расстояние одной вершины от центра"; variable = k0; min = 0.6; max = 1.4; step = 0.05; default = 1 }
new UI { name = "s_h"; type = slider; label = "высота h"; variable = h; min = 2; max = 5; step = 0.1; default = 3.5 }
new UI { name = "s_dx"; type = slider; label = "смещение вершины S по x"; variable = dx; min = -2; max = 2; step = 0.1; default = 0 }
new UI { name = "s_dz"; type = slider; label = "смещение вершины S по z"; variable = dz; min = -2; max = 2; step = 0.1; default = 0 }
new UI { name = "s_sf"; type = slider; label = "коэффициент подобия k"; variable = sf; min = 0.3; max = 0.9; step = 0.05; default = 0.6 }

string info = "";
float n = 5; float R = 2.2; float sx = 1; float k0 = 1; float h = 3.5; float dx = 0; float dz = 0; float kf = 1; float sf = 0.5;

Function bx(k) { float f = 1; if (k == 0 || k == n) { f = k0; } return f * R * sx * cos(6.283185 * k / n); }
Function bz(k) { float f = 1; if (k == 0 || k == n) { f = k0; } return f * R * sin(6.283185 * k / n); }
Function put(P, k) { P.pos.x = bx(k); P.pos.y = -h / 2; P.pos.z = bz(k); }
Function side(k) { return sqrt((bx(k + 1) - bx(k)) * (bx(k + 1) - bx(k)) + (bz(k + 1) - bz(k)) * (bz(k + 1) - bz(k))); }
Function el(k) { return sqrt((bx(k) - dx) * (bx(k) - dx) + h * h + (bz(k) - dz) * (bz(k) - dz)); }
Function dl(k) {
  float ax = bx(k + 1) - bx(k); float az = bz(k + 1) - bz(k);
  return abs(ax * (dz - bz(k)) - az * (dx - bx(k))) / side(k);
}
Function ap(k) { return sqrt(h * h + dl(k) * dl(k)); }
Function tf(k) {
  float ax = bx(k + 1) - bx(k); float az = bz(k + 1) - bz(k);
  return (ax * (dx - bx(k)) + az * (dz - bz(k))) / (side(k) * side(k));
}
Function face(k) { return side(k) * ap(k) / 2; }
Function area() { float s = 0; repeat (n) { s = s + bx(i) * bz(i + 1) - bx(i + 1) * bz(i); } return abs(s) / 2; }
Function per() { float s = 0; repeat (n) { s = s + side(i); } return s; }
Function lat() { float s = 0; repeat (n) { s = s + face(i); } return s; }
Function emin() { float m = el(0); repeat (n) { m = min(m, el(i)); } return m; }
Function emax() { float m = el(0); repeat (n) { m = max(m, el(i)); } return m; }
Function amin() { float m = ap(0); repeat (n) { m = min(m, ap(i)); } return m; }
Function amax() { float m = ap(0); repeat (n) { m = max(m, ap(i)); } return m; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function ang(c) { return acos(max(-1, min(1, c))) * 57.29578; }
Function sq(k) { return sf * bx(k) + (1 - sf) * dx; }
Function sw(k) { return sf * bz(k) + (1 - sf) * dz; }
Function sarea() { float s = 0; repeat (n) { s = s + sq(i) * sw(i + 1) - sq(i + 1) * sw(i); } return abs(s) / 2; }
Function put2(P, k) { P.pos.x = sq(k); P.pos.y = h / 2 - sf * h; P.pos.z = sw(k); }
Update {
  float o = round(n); n = o;
  put(B0, 0); put(B1, 1); put(B2, 2); put(B3, 3); put(B4, 4); put(B5, 5); put(B6, 6); put(B7, 7);
  put(X, n - 1); put(Y, 0);
  S.pos.x = dx; S.pos.y = h / 2; S.pos.z = dz;
  put2(C0, 0); put2(C1, 1); put2(C2, 2); put2(C3, 3); put2(C4, 4); put2(C5, 5); put2(C6, 6); put2(C7, 7);
  put2(U, n - 1); put2(V, 0);
  float hh = (1 - sf) * h; float s1 = sarea(); float s2 = area();
  info = "**Усечённая пирамида:** от пирамиды с вершиной S (тонкие рёбра) отсечена верхняя часть плоскостью, параллельной основанию. Осталось два основания — нижнее (площадь " + format(s2, 2) + ") и верхнее (площадь " + format(s1, 2) + ") — и **" + format(n, 0) + "** боковых граней-трапеций.\n\n";
  info = info + "Основания подобны с коэффициентом k = h₁ / h₂ = " + format(sf * h, 2) + " / " + format(h, 2) + " = **" + format(sf, 2) + "**. Отношение площадей S₁ / S₂ = " + format(s1 / s2, 3) + " = k² = " + format(sf * sf, 3) + ".\n\n";
  info = info + "Боковые рёбра лежат на рёбрах исходной пирамиды и сходятся в S. Высота усечённой пирамиды = **" + format(hh, 2) + "**, объём h·(S₁ + S₂ + √(S₁S₂)) / 3 = **" + format(hh * (s1 + s2 + sqrt(s1 * s2)) / 3, 2) + "**.";
}
]
