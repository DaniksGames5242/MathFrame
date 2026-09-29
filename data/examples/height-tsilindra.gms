[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.8;

// Цилиндр (в общем случае наклонный): основания — круги радиуса r с центрами O и O₁, образующая AA₁ = l
// наклонена на угол φ от перпендикуляра к основаниям. Высота h — расстояние между плоскостями оснований.
new Curve3D { name = "cb"; type = parametric; x = "bx + r * cos(2 * pi * t)"; y = "by"; z = "bz + r * sin(2 * pi * t)"; segments = 90; color = #3b82f6; thickness = 3 }
new Curve3D { name = "ct"; type = parametric; x = "bx + dx + r * cos(2 * pi * t)"; y = "by + h"; z = "bz + dz + r * sin(2 * pi * t)"; segments = 90; color = #3b82f6; thickness = 3 }
new Curve3D { name = "g0"; type = parametric; x = "bx + r * cos(0 * pi / 6) + dx * t"; y = "by + h * t"; z = "bz + r * sin(0 * pi / 6) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g1"; type = parametric; x = "bx + r * cos(1 * pi / 6) + dx * t"; y = "by + h * t"; z = "bz + r * sin(1 * pi / 6) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g2"; type = parametric; x = "bx + r * cos(2 * pi / 6) + dx * t"; y = "by + h * t"; z = "bz + r * sin(2 * pi / 6) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g3"; type = parametric; x = "bx + r * cos(3 * pi / 6) + dx * t"; y = "by + h * t"; z = "bz + r * sin(3 * pi / 6) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g4"; type = parametric; x = "bx + r * cos(4 * pi / 6) + dx * t"; y = "by + h * t"; z = "bz + r * sin(4 * pi / 6) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g5"; type = parametric; x = "bx + r * cos(5 * pi / 6) + dx * t"; y = "by + h * t"; z = "bz + r * sin(5 * pi / 6) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g6"; type = parametric; x = "bx + r * cos(6 * pi / 6) + dx * t"; y = "by + h * t"; z = "bz + r * sin(6 * pi / 6) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g7"; type = parametric; x = "bx + r * cos(7 * pi / 6) + dx * t"; y = "by + h * t"; z = "bz + r * sin(7 * pi / 6) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g8"; type = parametric; x = "bx + r * cos(8 * pi / 6) + dx * t"; y = "by + h * t"; z = "bz + r * sin(8 * pi / 6) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g9"; type = parametric; x = "bx + r * cos(9 * pi / 6) + dx * t"; y = "by + h * t"; z = "bz + r * sin(9 * pi / 6) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g10"; type = parametric; x = "bx + r * cos(10 * pi / 6) + dx * t"; y = "by + h * t"; z = "bz + r * sin(10 * pi / 6) + dz * t"; segments = 2; thickness = 1 }
new Curve3D { name = "g11"; type = parametric; x = "bx + r * cos(11 * pi / 6) + dx * t"; y = "by + h * t"; z = "bz + r * sin(11 * pi / 6) + dz * t"; segments = 2; thickness = 1 }

new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "O1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O₁") }
new Point3D { name = "A"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A") }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A₁") }
new Point3D { name = "H"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("H") }
new Point3D { name = "K"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("K") }
new Line3D { name = "ax"; pos = (O, O1); interact = false; thickness = 2 }
new Line3D { name = "gen"; pos = (A, A1); interact = false; thickness = 4; color = #f59e0b }
new Line3D { name = "hgt"; pos = (A1, H); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "hgt2"; pos = (O1, K); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "pr"; pos = (A, H); interact = false; thickness = 2 }

new UI { name = "s_r"; type = slider; label = "радиус основания r"; variable = r; min = 1; max = 2.5; step = 0.1; default = 1.6 }
new UI { name = "s_l"; type = slider; label = "образующая l"; variable = l; min = 2; max = 6; step = 0.1; default = 4.5 }
new UI { name = "s_phi"; type = slider; label = "наклон φ, °"; variable = phi; min = 0; max = 60; step = 1; default = 40 }
new UI { name = "s_psi"; type = slider; label = "направление наклона, °"; variable = psi; min = 0; max = 360; step = 1; default = 200 }

string info = "";
float r = 1.6; float l = 4.5; float phi = 40; float psi = 200;
float h = 3.9; float dx = 0; float dz = 0; float bx = 0; float by = 0; float bz = 0;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float g = radians(phi); float a = radians(psi);
  h = l * cos(g);
  dx = l * sin(g) * cos(a); dz = l * sin(g) * sin(a);
  bx = -dx / 2; by = -h / 2; bz = -dz / 2;
  O.pos.x = bx; O.pos.y = by; O.pos.z = bz;
  O1.pos.x = bx + dx; O1.pos.y = by + h; O1.pos.z = bz + dz;
  A.pos.x = bx + r * cos(a + 3.141593); A.pos.y = by; A.pos.z = bz + r * sin(a + 3.141593);
  A1.pos.x = A.pos.x + dx; A1.pos.y = by + h; A1.pos.z = A.pos.z + dz;
  H.pos.x = A1.pos.x; H.pos.y = by; H.pos.z = A1.pos.z;
  K.pos.x = O1.pos.x; K.pos.y = by; K.pos.z = O1.pos.z;
  info = "**Высота цилиндра** — расстояние между плоскостями оснований, то есть длина перпендикуляра A₁H к нижнему основанию. Образующая AA₁ = l = " + format(l, 2) + ", радиус r = " + format(r, 2) + ".\n\n";
  if (phi == 0) {
    info = info + "Цилиндр прямой: образующая перпендикулярна основаниям, поэтому **h = l = " + format(h, 2) + "**.\n\n";
  } else {
    info = info + "Цилиндр наклонный (φ = " + format(phi, 0) + "°). A₁H — катет прямоугольного треугольника AHA₁, гипотенуза которого — образующая: **h = l · cos φ = " + format(l, 2) + " · " + format(cos(g), 3) + " = " + format(h, 2) + "**. Проекция образующей AH = l · sin φ = " + format(l * sin(g), 2) + ", и h² + AH² = " + format(h * h, 2) + " + " + format(l * l * sin(g) * sin(g), 2) + " = l² = " + format(l * l, 2) + ".\n\n";
  }
  info = info + "Высота не зависит от выбора точки: A₁H = O₁K = " + format(h, 2) + " — параллельные плоскости оснований отстоят друг от друга на постоянное расстояние.";
}
]
