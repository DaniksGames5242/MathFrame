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
new Line3D { name = "dg"; pos = (V0, V6); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "db"; pos = (V0, V2); interact = false; thickness = 3; color = #22c55e }
new Angle3D { name = "r1"; type = pointAngle; measure = false; vertex = V0; point1 = V1; point2 = V3; radius = 0.7 }
new Angle3D { name = "r2"; type = pointAngle; measure = false; vertex = V0; point1 = V1; point2 = V4; radius = 0.7 }
new Angle3D { name = "r3"; type = pointAngle; measure = false; vertex = V0; point1 = V3; point2 = V4; radius = 0.7 }

new UI { name = "s_la"; type = slider; label = "ребро a"; variable = la; min = 1; max = 4.5; step = 0.1; default = 3.4 }
new UI { name = "s_lb"; type = slider; label = "ребро b"; variable = lb; min = 1; max = 4.5; step = 0.1; default = 2.4 }
new UI { name = "s_lc"; type = slider; label = "ребро c"; variable = lc; min = 1; max = 4.5; step = 0.1; default = 3 }

string info = "";
float la = 3.4; float lb = 2.4; float lc = 3;
float ax = 0; float ay = 0; float az = 0; float bx = 0; float by = 0; float bz = 0; float cx = 0; float cy = 0; float cz = 0;
float ox = 0; float oy = 0; float oz = 0;

Update {
  ax = la; ay = 0; az = 0; bx = 0; by = 0; bz = lb; cx = 0; cy = lc; cz = 0;
  ox = ax / 2; oy = cy / 2; oz = bz / 2;
  V0.pos.x = 0 * ax + 0 * bx + 0 * cx - ox; V0.pos.y = 0 * ay + 0 * by + 0 * cy - oy; V0.pos.z = 0 * az + 0 * bz + 0 * cz - oz;
  V1.pos.x = 1 * ax + 0 * bx + 0 * cx - ox; V1.pos.y = 1 * ay + 0 * by + 0 * cy - oy; V1.pos.z = 1 * az + 0 * bz + 0 * cz - oz;
  V2.pos.x = 1 * ax + 1 * bx + 0 * cx - ox; V2.pos.y = 1 * ay + 1 * by + 0 * cy - oy; V2.pos.z = 1 * az + 1 * bz + 0 * cz - oz;
  V3.pos.x = 0 * ax + 1 * bx + 0 * cx - ox; V3.pos.y = 0 * ay + 1 * by + 0 * cy - oy; V3.pos.z = 0 * az + 1 * bz + 0 * cz - oz;
  V4.pos.x = 0 * ax + 0 * bx + 1 * cx - ox; V4.pos.y = 0 * ay + 0 * by + 1 * cy - oy; V4.pos.z = 0 * az + 0 * bz + 1 * cz - oz;
  V5.pos.x = 1 * ax + 0 * bx + 1 * cx - ox; V5.pos.y = 1 * ay + 0 * by + 1 * cy - oy; V5.pos.z = 1 * az + 0 * bz + 1 * cz - oz;
  V6.pos.x = 1 * ax + 1 * bx + 1 * cx - ox; V6.pos.y = 1 * ay + 1 * by + 1 * cy - oy; V6.pos.z = 1 * az + 1 * bz + 1 * cz - oz;
  V7.pos.x = 0 * ax + 1 * bx + 1 * cx - ox; V7.pos.y = 0 * ay + 1 * by + 1 * cy - oy; V7.pos.z = 0 * az + 1 * bz + 1 * cz - oz;
  float db = sqrt(la * la + lb * lb); float d = sqrt(la * la + lb * lb + lc * lc);
  info = "**Прямоугольный параллелепипед:** все 6 граней — прямоугольники, все рёбра при каждой вершине попарно перпендикулярны. Рёбра из вершины A: **a = " + format(la, 1) + "**, **b = " + format(lb, 1) + "**, **c = " + format(lc, 1) + "**; противоположные грани равны и параллельны.\n\n";
  info = info + "**Диагональ** AC₁ (зелёная) — гипотенуза прямоугольного треугольника с катетами AC = √(a² + b²) = " + format(db, 2) + " и CC₁ = c: **d² = a² + b² + c² = " + format(la * la + lb * lb + lc * lc, 2) + "**, d = **" + format(d, 2) + "**. Все четыре диагонали равны и делятся точкой пересечения пополам.\n\n";
  info = info + "Объём **V = abc = " + format(la * lb * lc, 2) + "**, площадь поверхности **S = 2(ab + bc + ac) = " + format(2 * (la * lb + lb * lc + la * lc), 2) + "**.";
  if (abs(la - lb) < 0.05 && abs(lb - lc) < 0.05) { info = info + " Три ребра равны — это куб."; }
}
]
