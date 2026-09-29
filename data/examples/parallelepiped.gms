[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.6;

new Point3D { name = "V0"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A") }
new Point3D { name = "V1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B") }
new Point3D { name = "V2"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("C") }
new Point3D { name = "V3"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("D") }
new Point3D { name = "V4"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A₁") }
new Point3D { name = "V5"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B₁") }
new Point3D { name = "V6"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("C₁") }
new Point3D { name = "V7"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("D₁") }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O"); color = #f59e0b }
new Line3D { name = "e0"; pos = (V0, V1); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e1"; pos = (V1, V2); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e2"; pos = (V2, V3); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e3"; pos = (V3, V0); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e4"; pos = (V4, V5); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e5"; pos = (V5, V6); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e6"; pos = (V6, V7); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e7"; pos = (V7, V4); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e8"; pos = (V0, V4); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "e9"; pos = (V1, V5); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "e10"; pos = (V2, V6); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "e11"; pos = (V3, V7); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "d0"; pos = (V0, V6); interact = false; thickness = 2; color = #f59e0b }
new Line3D { name = "d1"; pos = (V1, V7); interact = false; thickness = 2; color = #f59e0b }
new Line3D { name = "d2"; pos = (V2, V4); interact = false; thickness = 2; color = #f59e0b }
new Line3D { name = "d3"; pos = (V3, V5); interact = false; thickness = 2; color = #f59e0b }

new UI { name = "s_la"; type = slider; label = "ребро a"; variable = la; min = 2; max = 4; step = 0.1; default = 3.4 }
new UI { name = "s_lb"; type = slider; label = "ребро b"; variable = lb; min = 2; max = 4; step = 0.1; default = 2.8 }
new UI { name = "s_gam"; type = slider; label = "угол между a и b, °"; variable = gam; min = 50; max = 130; step = 1; default = 70 }
new UI { name = "s_lc"; type = slider; label = "ребро c"; variable = lc; min = 2; max = 4; step = 0.1; default = 3.4 }
new UI { name = "s_phi"; type = slider; label = "наклон ребра c, °"; variable = phi; min = 0; max = 45; step = 1; default = 25 }
new UI { name = "s_psi"; type = slider; label = "направление наклона, °"; variable = psi; min = 0; max = 360; step = 1; default = 40 }

string info = "";
float la = 3.4; float lb = 2.8; float gam = 70; float lc = 3.4; float phi = 25; float psi = 40;
float ax = 0; float ay = 0; float az = 0; float bx = 0; float by = 0; float bz = 0; float cx = 0; float cy = 0; float cz = 0;
float ox = 0; float oy = 0; float oz = 0;

Function vlen(x, y, z) { return sqrt(x * x + y * y + z * z); }
Function ang(x1, y1, z1, x2, y2, z2) { return acos(max(-1, min(1, (x1 * x2 + y1 * y2 + z1 * z2) / (vlen(x1, y1, z1) * vlen(x2, y2, z2))))) * 57.29578; }
Function crs(x1, y1, z1, x2, y2, z2) { return vlen(y1 * z2 - z1 * y2, z1 * x2 - x1 * z2, x1 * y2 - y1 * x2); }
Function rt(v) { if (abs(v - 90) < 0.05) { return 1; } return 0; }

Update {
  float g = radians(gam); float f = radians(phi); float p = radians(psi);
  ax = la; ay = 0; az = 0;
  bx = lb * cos(g); by = 0; bz = lb * sin(g);
  cx = lc * sin(f) * cos(p); cy = lc * cos(f); cz = lc * sin(f) * sin(p);
  ox = (ax + bx + cx) / 2; oy = (ay + by + cy) / 2; oz = (az + bz + cz) / 2;
  V0.pos.x = 0 * ax + 0 * bx + 0 * cx - ox; V0.pos.y = 0 * ay + 0 * by + 0 * cy - oy; V0.pos.z = 0 * az + 0 * bz + 0 * cz - oz;
  V1.pos.x = 1 * ax + 0 * bx + 0 * cx - ox; V1.pos.y = 1 * ay + 0 * by + 0 * cy - oy; V1.pos.z = 1 * az + 0 * bz + 0 * cz - oz;
  V2.pos.x = 1 * ax + 1 * bx + 0 * cx - ox; V2.pos.y = 1 * ay + 1 * by + 0 * cy - oy; V2.pos.z = 1 * az + 1 * bz + 0 * cz - oz;
  V3.pos.x = 0 * ax + 1 * bx + 0 * cx - ox; V3.pos.y = 0 * ay + 1 * by + 0 * cy - oy; V3.pos.z = 0 * az + 1 * bz + 0 * cz - oz;
  V4.pos.x = 0 * ax + 0 * bx + 1 * cx - ox; V4.pos.y = 0 * ay + 0 * by + 1 * cy - oy; V4.pos.z = 0 * az + 0 * bz + 1 * cz - oz;
  V5.pos.x = 1 * ax + 0 * bx + 1 * cx - ox; V5.pos.y = 1 * ay + 0 * by + 1 * cy - oy; V5.pos.z = 1 * az + 0 * bz + 1 * cz - oz;
  V6.pos.x = 1 * ax + 1 * bx + 1 * cx - ox; V6.pos.y = 1 * ay + 1 * by + 1 * cy - oy; V6.pos.z = 1 * az + 1 * bz + 1 * cz - oz;
  V7.pos.x = 0 * ax + 1 * bx + 1 * cx - ox; V7.pos.y = 0 * ay + 1 * by + 1 * cy - oy; V7.pos.z = 0 * az + 1 * bz + 1 * cz - oz;
  M.pos.x = 0; M.pos.y = 0; M.pos.z = 0;
  float d1 = vlen(ax + bx + cx, ay + by + cy, az + bz + cz); float d2 = vlen(bx + cx - ax, by + cy - ay, bz + cz - az);
  float d3 = vlen(ax - bx + cx, ay - by + cy, az - bz + cz); float d4 = vlen(ax + bx - cx, ay + by - cy, az + bz - cz);
  float sab = crs(ax, ay, az, bx, by, bz); float sbc = crs(bx, by, bz, cx, cy, cz); float sac = crs(ax, ay, az, cx, cy, cz);
  float vol = abs(ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx));
  float sd = d1 * d1 + d2 * d2 + d3 * d3 + d4 * d4; float se = 4 * (la * la + lb * lb + lc * lc);
  float al = ang(bx, by, bz, cx, cy, cz); float be = ang(ax, ay, az, cx, cy, cz);
  float nr = rt(gam) + rt(al) + rt(be);
  info = "**Параллелепипед** — призма с параллелограммом в основании: все 6 граней — параллелограммы, противоположные грани параллельны и равны (3 пары), противоположные рёбра параллельны и равны. Рёбра из вершины A: **a = " + format(la, 1) + "**, **b = " + format(lb, 1) + "**, **c = " + format(lc, 1) + "**; углы между ними: (a, b) = " + format(gam, 0) + "°, (b, c) = " + format(al, 0) + "°, (a, c) = " + format(be, 0) + "°.\n\n";
  info = info + "**Диагонали** пересекаются в одной точке O и делятся ею пополам: AC₁ = " + format(d1, 2) + ", BD₁ = " + format(d2, 2) + ", CA₁ = " + format(d3, 2) + ", DB₁ = " + format(d4, 2) + ". Сумма квадратов диагоналей " + format(sd, 1) + " = сумме квадратов 12 рёбер " + format(se, 1) + ".\n\n";
  info = info + "Пары граней: S(ab) = " + format(sab, 2) + ", S(bc) = " + format(sbc, 2) + ", S(ac) = " + format(sac, 2) + "; полная поверхность **S = 2(S(ab) + S(bc) + S(ac)) = " + format(2 * (sab + sbc + sac), 2) + "**, объём **V = |a·(b×c)| = " + format(vol, 2) + "** = S₀·h, где S₀ = " + format(sab, 2) + ", h = " + format(cy, 2) + ".";
  if (nr > 2.5) { info = info + " Все углы между рёбрами прямые — получился прямоугольный параллелепипед."; }
}
]
