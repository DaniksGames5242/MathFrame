[
description = "{info}"

field width = 14; field height = 14; field depth = 14;
show grid = false; show axes = false;
camera start rot = (35, 68);
camera start zoom = 1.2;

// Плоскость Ax + By + Cz + D = 0 (синяя), точка M (жёлтая), её ортогональная проекция M′ (зелёная) —
// основание перпендикуляра MM′ к плоскости; M′ = M − t·(A, B, C), t = (Ax₀ + By₀ + Cz₀ + D) / (A² + B² + C²).
new Point3D { name = "P0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "P1"; pos = (1, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "P2"; pos = (0, 0, 1); dynamic = false; collision = false; active = false }
new Point3D { name = "M"; pos = (2, 3, 1); dynamic = false; collision = false; color = #f59e0b; text = true("M") }
new Point3D { name = "Mp"; pos = (0, 0, 0); dynamic = false; collision = false; color = #22c55e; text = true("M′") }
draw InfPlane { name = "alpha"; points = (P0, P1, P2); size = 5; opacity = 0.22; color = #3b82f6 }
new Line3D { name = "perp"; pos = (M, Mp); interact = false; thickness = 3; color = #22c55e }

new UI { type = slider; label = "A"; variable = pa; min = -3; max = 3; step = 0.5; default = 1 }
new UI { type = slider; label = "B"; variable = pb; min = -3; max = 3; step = 0.5; default = 2 }
new UI { type = slider; label = "C"; variable = pc; min = -3; max = 3; step = 0.5; default = 1 }
new UI { type = slider; label = "D"; variable = pd; min = -4; max = 4; step = 0.5; default = 0 }
new UI { type = slider; label = "x₀"; variable = mx; min = -4; max = 4; step = 0.5; default = 2 }
new UI { type = slider; label = "y₀"; variable = my; min = -4; max = 4; step = 0.5; default = 3 }
new UI { type = slider; label = "z₀"; variable = mz; min = -4; max = 4; step = 0.5; default = 1 }

string info = "";
float pa = 1; float pb = 2; float pc = 1; float pd = 0; float mx = 2; float my = 3; float mz = 1;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float a = pa; float b = pb; float c = pc;
  if (abs(a) + abs(b) + abs(c) < 0.1) { b = 1; }
  float n2 = a * a + b * b + c * c;
  float nl = sqrt(n2);
  float f0 = a * mx + b * my + c * mz + pd;
  float t = f0 / n2;
  Mp.pos.x = mx - t * a; Mp.pos.y = my - t * b; Mp.pos.z = mz - t * c;
  M.pos.x = mx; M.pos.y = my; M.pos.z = mz;
  // точки плоскости: основание нормали и два ортогональных направления в плоскости
  float qx = -pd * a / n2; float qy = -pd * b / n2; float qz = -pd * c / n2;
  float ex = 0; float ey = 1; float ez = 0;
  if (abs(b) > 0.8 * nl) { ex = 1; ey = 0; }
  float ux = b * ez - c * ey; float uy = c * ex - a * ez; float uz = a * ey - b * ex;
  float ul = sqrt(ux * ux + uy * uy + uz * uz);
  ux = ux / ul; uy = uy / ul; uz = uz / ul;
  float vx = b * uz - c * uy; float vy = c * ux - a * uz; float vz = a * uy - b * ux;
  float vl = sqrt(vx * vx + vy * vy + vz * vz);
  vx = vx / vl; vy = vy / vl; vz = vz / vl;
  P0.pos.x = qx; P0.pos.y = qy; P0.pos.z = qz;
  P1.pos.x = qx + ux; P1.pos.y = qy + uy; P1.pos.z = qz + uz;
  P2.pos.x = qx + vx; P2.pos.y = qy + vy; P2.pos.z = qz + vz;
  float dist = abs(f0) / nl;
  info = "**Ортогональная проекция точки** M на плоскость α: Ax + By + Cz + D = 0, где A = " + num(a, 1) + ", B = " + num(b, 1) + ", C = " + num(c, 1) + ", D = " + num(pd, 1) + " — основание перпендикуляра, опущенного из M на α.\n\nПрямая через M перпендикулярно α: x = x₀ + At, y = y₀ + Bt, z = z₀ + Ct. Подстановка в уравнение плоскости даёт t = (Ax₀ + By₀ + Cz₀ + D) / (A² + B² + C²) = " + num(f0, 2) + " / " + format(n2, 2) + " = " + num(t, 3) + ".\n\n**M′ = (" + num(Mp.pos.x, 2) + "; " + num(Mp.pos.y, 2) + "; " + num(Mp.pos.z, 2) + ")**, M = (" + num(mx, 1) + "; " + num(my, 1) + "; " + num(mz, 1) + "), расстояние MM′ = " + format(dist, 2) + ".\n\n";
  if (dist < 0.005) { info = info + "**M лежит в плоскости:** перпендикуляр вырождается в нуль, проекция M′ совпадает с M."; }
  else { info = info + "Проекция единственна: через M вне плоскости проходит ровно один перпендикуляр к ней."; }
}
]
