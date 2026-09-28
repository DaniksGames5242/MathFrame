[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 62);
camera start zoom = 1.25;

// Параллельные плоскости α (внизу) и β (вверху). Две параллельные прямые A₁B₁ и A₂B₂
// пересекают обе плоскости. Ползунки: расстояние между плоскостями, наклон прямых,
// их направление и расстояние между A₁ и A₂.
new Point3D { name = "A1"; pos = (-1, -1.2, -1); dynamic = false; collision = false; text = true("A₁") }
new Point3D { name = "A2"; pos = (1, -1.2, 1); dynamic = false; collision = false; text = true("A₂") }
new Point3D { name = "B1"; pos = (-1, 1.2, -1); dynamic = false; collision = false; text = true("B₁") }
new Point3D { name = "B2"; pos = (1, 1.2, 1); dynamic = false; collision = false; text = true("B₂") }
new Point3D { name = "E1"; pos = (-3, -1.2, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "E2"; pos = (3, -1.2, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "E3"; pos = (0, -1.2, 3); dynamic = false; collision = false; active = false }
new Point3D { name = "G1"; pos = (-3, 1.2, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "G2"; pos = (3, 1.2, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "G3"; pos = (0, 1.2, 3); dynamic = false; collision = false; active = false }

draw InfPlane { name = "planeA"; points = (E1, E2, E3); size = 4; opacity = 0.22; color = #3b82f6 }
draw InfPlane { name = "planeB"; points = (G1, G2, G3); size = 4; opacity = 0.22; color = #3b82f6 }
new Line3D { name = "t1"; pos = (A1, B1); interact = false; thickness = 3.5; color = #f59e0b }
new Line3D { name = "t2"; pos = (A2, B2); interact = false; thickness = 3.5; color = #f59e0b }
new Line3D { name = "la"; pos = (A1, A2); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "lb"; pos = (B1, B2); interact = false; thickness = 3; color = #22c55e }

new UI { name = "sH"; type = slider; label = "расстояние между плоскостями"; variable = h; min = 1; max = 4; step = 0.1; default = 2.4 }
new UI { name = "sTh"; type = slider; label = "наклон прямых, °"; variable = th; min = 0; max = 60; step = 1; default = 30 }
new UI { name = "sPs"; type = slider; label = "направление наклона, °"; variable = ps; min = 0; max = 360; step = 5; default = 40 }
new UI { name = "sD"; type = slider; label = "расстояние A₁A₂"; variable = dd; min = 1; max = 6; step = 0.1; default = 3.6 }

string info = "";
float h = 2.4; float th = 30; float ps = 40; float dd = 3.6;

Update {
  float y0 = -h / 2; float y1 = h / 2;
  // A₁, A₂ в плоскости α симметрично относительно центра; отрезок A₁A₂ повёрнут на 35° от оси x.
  float ax = dd / 2 * cos(radians(35)); float az = dd / 2 * sin(radians(35));
  // Вектор A → B: подъём на h и сдвиг h·tg θ в направлении ψ.
  float sh = h * tan(radians(th));
  float wx = sh * cos(radians(ps)); float wz = sh * sin(radians(ps));
  A1.pos.x = -ax - wx / 2; A1.pos.y = y0; A1.pos.z = -az - wz / 2;
  A2.pos.x = ax - wx / 2; A2.pos.y = y0; A2.pos.z = az - wz / 2;
  B1.pos.x = A1.pos.x + wx; B1.pos.y = y1; B1.pos.z = A1.pos.z + wz;
  B2.pos.x = A2.pos.x + wx; B2.pos.y = y1; B2.pos.z = A2.pos.z + wz;
  E1.pos.y = y0; E2.pos.y = y0; E3.pos.y = y0;
  G1.pos.y = y1; G2.pos.y = y1; G3.pos.y = y1;

  float l = h / cos(radians(th));
  info = "**Свойства параллельных плоскостей.** Отрезки параллельных прямых, заключённые между параллельными плоскостями α и β, равны: A₁B₁ = A₂B₂ = " + format(l, 2) + ".\n\nПлоскость, проведённая через эти прямые, пересекает α и β по параллельным прямым A₁A₂ ∥ B₁B₂, поэтому A₁A₂B₂B₁ — параллелограмм: A₁A₂ = B₁B₂ = " + format(dd, 2) + ".";
  if (th == 0) { info = info + " Прямые перпендикулярны плоскостям, отрезки равны расстоянию между плоскостями h = " + format(h, 1) + " — параллелограмм стал прямоугольником."; }
  else { info = info + " Перпендикулярный отрезок между плоскостями короче: h = " + format(h, 1) + " < " + format(l, 2) + "."; }
}
]
