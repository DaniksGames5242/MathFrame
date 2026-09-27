[
description = "{info}"

field width = 9;
field height = 9;
field depth = 9;
show grid = false;
show axes = false;

// ---- Шар радиуса R = 3 с центром O ----
new Primitive { name = "ball"; type = sphere; pos = (0, 0, 0); radius = 3; opacity = 0.18; color = #3b82f6 }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; text = true("O") }

// ---- Секущая плоскость: расстояние d от центра и наклон α (ползунки) ----
// Плоскость проходит через три точки, которые пересчитываются в Update.
new Point3D { name = "C"; pos = (0, 1.5, 0); dynamic = false; text = true("O₁"); color = #f59e0b }
new Point3D { name = "U"; pos = (1, 1.5, 0); dynamic = false; active = false }
new Point3D { name = "W"; pos = (0, 1.5, 1); dynamic = false; active = false }
draw InfPlane { name = "plane"; points = (C, U, W); size = 4.2; opacity = 0.25; color = #f59e0b }

// ---- Сечение — окружность радиуса r с центром O₁, и прямоугольный треугольник O O₁ M ----
new Curve3D { name = "sect"; type = parametric; x = "scx + sr * cos(2 * pi * t) * ux"; y = "scy + sr * cos(2 * pi * t) * uy"; z = "sr * sin(2 * pi * t)"; segments = 120; color = #f59e0b; thickness = 4 }
new Point3D { name = "M"; pos = (2.6, 1.5, 0); dynamic = false; text = true("M"); color = #f59e0b }
new Line3D { name = "oc"; pos = (O, C); color = #22c55e; thickness = 3 }
new Line3D { name = "cm"; pos = (C, M); color = #f59e0b; thickness = 3 }
new Line3D { name = "om"; pos = (O, M); thickness = 2 }

new UI { name = "sD"; type = slider; label = "d"; variable = d; min = 0; max = 3; step = 0.05; default = 1.5 }
new UI { name = "sA"; type = slider; label = "наклон α°"; variable = alpha; min = 0; max = 80; step = 1; default = 20 }

// ---- Логика ----
float R = 3;
float d = 1.5;
float alpha = 20;
float sr = 2.6;
float ux = 1; float uy = 0;
float scx = 0; float scy = 1.5;
string info = "";

Update {
  // Нормаль плоскости n = (sin α, cos α, 0); направления в плоскости: u = (cos α, −sin α, 0), (0, 0, 1)
  float a = radians(alpha);
  float nx = sin(a); float ny = cos(a);
  ux = cos(a); uy = -sin(a);
  sr = sqrt(max(R * R - d * d, 0));
  C.pos.x = d * nx; C.pos.y = d * ny; C.pos.z = 0;
  scx = C.pos.x; scy = C.pos.y;
  U.pos.x = C.pos.x + ux; U.pos.y = C.pos.y + uy; U.pos.z = 0;
  W.pos.x = C.pos.x; W.pos.y = C.pos.y; W.pos.z = 1;
  M.pos.x = C.pos.x + sr * ux; M.pos.y = C.pos.y + sr * uy; M.pos.z = 0;

  info = "**Сечение шара плоскостью — круг.** Его центр O₁ — основание перпендикуляра из центра шара на плоскость, а радиус находится из прямоугольного треугольника O O₁ M: r = √(R² − d²).\n\nR = 3, d = " + format(d, 2) + ":   r = √(9 − " + format(d * d, 2) + ") = " + format(sr, 2) + ".";
  if (d < 0.001) { info = info + " Плоскость проходит через центр — сечение наибольшее, r = R (большой круг)."; }
  if (d > 2.999) { info = info + " При d = R плоскость касается шара — сечение вырождается в точку."; }
  info = info + "\n\nВращайте сцену мышью, чтобы посмотреть на сечение с разных сторон.";
}
]
