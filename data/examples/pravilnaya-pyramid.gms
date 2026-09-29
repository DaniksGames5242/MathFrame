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
new Point3D { name = "H"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("H"); }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M"); }
new Line3D { name = "b0"; pos = (B0, B1); interact = false; thickness = 3; active = n > 1.5; color = #3b82f6; }
new Line3D { name = "b1"; pos = (B1, B2); interact = false; thickness = 3; active = n > 2.5; color = #3b82f6; }
new Line3D { name = "b2"; pos = (B2, B3); interact = false; thickness = 3; active = n > 3.5; color = #3b82f6; }
new Line3D { name = "b3"; pos = (B3, B4); interact = false; thickness = 3; active = n > 4.5; color = #3b82f6; }
new Line3D { name = "b4"; pos = (B4, B5); interact = false; thickness = 3; active = n > 5.5; color = #3b82f6; }
new Line3D { name = "b5"; pos = (B5, B6); interact = false; thickness = 3; active = n > 6.5; color = #3b82f6; }
new Line3D { name = "b6"; pos = (B6, B7); interact = false; thickness = 3; active = n > 7.5; color = #3b82f6; }
new Line3D { name = "bc"; pos = (X, Y); interact = false; thickness = 3; color = #3b82f6; }
new Line3D { name = "e0"; pos = (B0, S); interact = false; thickness = 2; active = n > 0.5; }
new Line3D { name = "e1"; pos = (B1, S); interact = false; thickness = 2; active = n > 1.5; }
new Line3D { name = "e2"; pos = (B2, S); interact = false; thickness = 2; active = n > 2.5; }
new Line3D { name = "e3"; pos = (B3, S); interact = false; thickness = 2; active = n > 3.5; }
new Line3D { name = "e4"; pos = (B4, S); interact = false; thickness = 2; active = n > 4.5; }
new Line3D { name = "e5"; pos = (B5, S); interact = false; thickness = 2; active = n > 5.5; }
new Line3D { name = "e6"; pos = (B6, S); interact = false; thickness = 2; active = n > 6.5; }
new Line3D { name = "e7"; pos = (B7, S); interact = false; thickness = 2; active = n > 7.5; }
new Line3D { name = "hl"; pos = (S, H); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "ap"; pos = (S, M); interact = false; thickness = 5; color = #f59e0b }
new Line3D { name = "hm"; pos = (H, M); interact = false; thickness = 3 }
new Angle3D { name = "SHM"; type = pointAngle; vertex = H; point1 = S; point2 = M; radius = 0.9 }

new UI { name = "s_n"; type = slider; label = "число сторон основания n"; variable = n; min = 3; max = 8; step = 1; default = 5 }
new UI { name = "s_R"; type = slider; label = "размер основания"; variable = R; min = 1.2; max = 2.6; step = 0.1; default = 2.2 }
new UI { name = "s_h"; type = slider; label = "высота h"; variable = h; min = 2; max = 5; step = 0.1; default = 3.5 }

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

Update {
  float o = round(n); n = o;
  put(B0, 0); put(B1, 1); put(B2, 2); put(B3, 3); put(B4, 4); put(B5, 5); put(B6, 6); put(B7, 7);
  put(X, n - 1); put(Y, 0);
  S.pos.x = dx; S.pos.y = h / 2; S.pos.z = dz;
  H.pos.x = dx; H.pos.y = -h / 2; H.pos.z = dz;
  M.pos.x = (bx(0) + bx(1)) / 2; M.pos.y = -h / 2; M.pos.z = (bz(0) + bz(1)) / 2;
  float r = R * cos(3.141593 / n); float a = side(0); float l = sqrt(R * R + h * h); float ha = sqrt(r * r + h * h);
  info = "**Правильная пирамида:** основание — правильный " + format(n, 0) + "-угольник со стороной a = " + format(a, 2) + " (R = " + format(R, 2) + "), вершина S проецируется в его центр H. Высота SH = **" + format(h, 2) + "**.\n\n";
  info = info + "Все **" + format(n, 0) + "** боковых рёбер равны: l = √(R² + h²) = **" + format(l, 2) + "**, и образуют с основанием равные углы " + format(ang(R / l), 1) + "°. Боковые грани — равные равнобедренные треугольники.\n\n";
  info = info + "Все апофемы равны: SM = √(r² + h²) = **" + format(ha, 2) + "** (r = " + format(r, 2) + " — расстояние от H до стороны). Двугранные углы при сторонах основания равны " + format(ang(r / ha), 1) + "°.\n\n";
  info = info + "Площадь боковой поверхности ½·P·SM = **" + format(per() * ha / 2, 2) + "**.";
}
]
