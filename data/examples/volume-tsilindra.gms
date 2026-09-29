[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.8;

// Цилиндр (прямой или наклонный) как стопка одинаковых кругов площади πr² (принцип Кавальери). Оранжевый круг —
// сечение плоскостью, параллельной основаниям, на высоте s·h. Высота h — расстояние между плоскостями оснований.
new Curve3D { name = "cb"; type = parametric; x = "bx + r * cos(2 * pi * t)"; y = "by"; z = "bz + r * sin(2 * pi * t)"; segments = 90; color = #3b82f6; thickness = 3 }
new Curve3D { name = "ct"; type = parametric; x = "bx + dx + r * cos(2 * pi * t)"; y = "by + h"; z = "bz + dz + r * sin(2 * pi * t)"; segments = 90; color = #3b82f6; thickness = 3 }
new Curve3D { name = "m1"; type = parametric; x = "bx + dx * 1 / 10 + r * cos(2 * pi * t)"; y = "by + h * 1 / 10"; z = "bz + dz * 1 / 10 + r * sin(2 * pi * t)"; segments = 60; color = #3b82f6; thickness = 1 }
new Curve3D { name = "m2"; type = parametric; x = "bx + dx * 2 / 10 + r * cos(2 * pi * t)"; y = "by + h * 2 / 10"; z = "bz + dz * 2 / 10 + r * sin(2 * pi * t)"; segments = 60; color = #3b82f6; thickness = 1 }
new Curve3D { name = "m3"; type = parametric; x = "bx + dx * 3 / 10 + r * cos(2 * pi * t)"; y = "by + h * 3 / 10"; z = "bz + dz * 3 / 10 + r * sin(2 * pi * t)"; segments = 60; color = #3b82f6; thickness = 1 }
new Curve3D { name = "m4"; type = parametric; x = "bx + dx * 4 / 10 + r * cos(2 * pi * t)"; y = "by + h * 4 / 10"; z = "bz + dz * 4 / 10 + r * sin(2 * pi * t)"; segments = 60; color = #3b82f6; thickness = 1 }
new Curve3D { name = "m5"; type = parametric; x = "bx + dx * 5 / 10 + r * cos(2 * pi * t)"; y = "by + h * 5 / 10"; z = "bz + dz * 5 / 10 + r * sin(2 * pi * t)"; segments = 60; color = #3b82f6; thickness = 1 }
new Curve3D { name = "m6"; type = parametric; x = "bx + dx * 6 / 10 + r * cos(2 * pi * t)"; y = "by + h * 6 / 10"; z = "bz + dz * 6 / 10 + r * sin(2 * pi * t)"; segments = 60; color = #3b82f6; thickness = 1 }
new Curve3D { name = "m7"; type = parametric; x = "bx + dx * 7 / 10 + r * cos(2 * pi * t)"; y = "by + h * 7 / 10"; z = "bz + dz * 7 / 10 + r * sin(2 * pi * t)"; segments = 60; color = #3b82f6; thickness = 1 }
new Curve3D { name = "m8"; type = parametric; x = "bx + dx * 8 / 10 + r * cos(2 * pi * t)"; y = "by + h * 8 / 10"; z = "bz + dz * 8 / 10 + r * sin(2 * pi * t)"; segments = 60; color = #3b82f6; thickness = 1 }
new Curve3D { name = "m9"; type = parametric; x = "bx + dx * 9 / 10 + r * cos(2 * pi * t)"; y = "by + h * 9 / 10"; z = "bz + dz * 9 / 10 + r * sin(2 * pi * t)"; segments = 60; color = #3b82f6; thickness = 1 }
new Curve3D { name = "g0"; type = parametric; x = "bx + r * cos(0 * pi / 4) + dx * t"; y = "by + h * t"; z = "bz + r * sin(0 * pi / 4) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g1"; type = parametric; x = "bx + r * cos(1 * pi / 4) + dx * t"; y = "by + h * t"; z = "bz + r * sin(1 * pi / 4) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g2"; type = parametric; x = "bx + r * cos(2 * pi / 4) + dx * t"; y = "by + h * t"; z = "bz + r * sin(2 * pi / 4) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g3"; type = parametric; x = "bx + r * cos(3 * pi / 4) + dx * t"; y = "by + h * t"; z = "bz + r * sin(3 * pi / 4) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g4"; type = parametric; x = "bx + r * cos(4 * pi / 4) + dx * t"; y = "by + h * t"; z = "bz + r * sin(4 * pi / 4) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g5"; type = parametric; x = "bx + r * cos(5 * pi / 4) + dx * t"; y = "by + h * t"; z = "bz + r * sin(5 * pi / 4) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g6"; type = parametric; x = "bx + r * cos(6 * pi / 4) + dx * t"; y = "by + h * t"; z = "bz + r * sin(6 * pi / 4) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g7"; type = parametric; x = "bx + r * cos(7 * pi / 4) + dx * t"; y = "by + h * t"; z = "bz + r * sin(7 * pi / 4) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "sl"; type = parametric; x = "bx + dx * s + r * cos(2 * pi * t)"; y = "by + h * s"; z = "bz + dz * s + r * sin(2 * pi * t)"; segments = 90; color = #f59e0b; thickness = 5 }
new Curve3D { name = "axc"; type = parametric; x = "bx + dx * t"; y = "by + h * t"; z = "bz + dz * t"; segments = 2; thickness = 2 }

new UI { name = "s_r"; type = slider; label = "радиус основания r"; variable = r; min = 1; max = 2.5; step = 0.1; default = 2 }
new UI { name = "s_h"; type = slider; label = "высота h"; variable = h; min = 1; max = 4.5; step = 0.1; default = 3.5 }
new UI { name = "s_phi"; type = slider; label = "наклон φ, °"; variable = phi; min = 0; max = 45; step = 1; default = 25 }
new UI { name = "s_s"; type = slider; label = "высота сечения"; variable = s; min = 0; max = 1; step = 0.01; default = 0.4 }

string info = "";
float r = 2; float h = 3.5; float phi = 25; float s = 0.4;
float dx = 0; float dz = 0; float bx = 0; float by = 0; float bz = 0;

Update {
  float g = radians(phi); float a = radians(200);
  dx = h * tan(g) * cos(a); dz = h * tan(g) * sin(a);
  bx = -dx / 2; by = -h / 2; bz = -dz / 2;
  float so = pi * r * r;
  info = "**Объём цилиндра** — произведение площади основания на высоту: **V = S_осн · h = πr² · h**. Любое сечение плоскостью, параллельной основаниям, — круг того же радиуса r = " + format(r, 2) + ", поэтому его площадь всегда равна πr² = " + format(so, 2) + " (у оранжевого сечения на высоте " + format(s * h, 2) + " — тоже).\n\n";
  info = info + "**V = π · " + format(r, 2) + "² · " + format(h, 2) + " = " + format(so, 2) + " · " + format(h, 2) + " = " + format(so * h, 2) + "**. Это сумма десяти слоёв: каждый — площадь " + format(so, 2) + " на толщину " + format(h / 10, 2) + ", вместе " + format(10 * so * h / 10, 2) + ".\n\n";
  if (phi == 0) { info = info + "Цилиндр прямой, h равна образующей."; }
  else { info = info + "Цилиндр наклонный (φ = " + format(phi, 0) + "°, образующая l = " + format(h / cos(g), 2) + "): объём считается по высоте h, а не по образующей, и при наклоне не меняется — круги лишь сдвигаются друг относительно друга."; }
  info = info + " Радиус в 2 раза больше — объём в 4 раза больше, высота в 2 раза больше — объём в 2 раза больше.";
}
]
