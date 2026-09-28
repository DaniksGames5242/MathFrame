[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 62);
camera start zoom = 1.1;

// Плоскость α, точка O в ней и прямая l через O. Ползунки наклоняют l (θ — от
// вертикали, ψ — направление наклона) и поворачивают прямую m в плоскости α через O (χ).
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "W1"; pos = (-3, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "W2"; pos = (3, 0, 0); dynamic = false; collision = false; text = true("m₁") }
new Point3D { name = "W3"; pos = (0, 0, 3); dynamic = false; collision = false; text = true("m₂") }
new Point3D { name = "W4"; pos = (0, 0, -3); dynamic = false; collision = false; active = false }
new Point3D { name = "M1"; pos = (-2, 0, -2); dynamic = false; collision = false; active = false }
new Point3D { name = "M2"; pos = (2, 0, 2); dynamic = false; collision = false; text = true("m") }
new Point3D { name = "U"; pos = (0, 3.5, 0); dynamic = false; collision = false; text = true("l") }
new Point3D { name = "D"; pos = (0, -2.5, 0); dynamic = false; collision = false; active = false }

draw InfPlane { name = "planeA"; points = (W1, W2, W3); size = 3.6; opacity = 0.22; color = #3b82f6 }
new Line3D { name = "m1"; pos = (W1, W2); interact = false; thickness = 2 }
new Line3D { name = "m2"; pos = (W4, W3); interact = false; thickness = 2 }
new Line3D { name = "mm"; pos = (M1, M2); interact = false; thickness = 3.5; color = #22c55e }
new Line3D { name = "ll"; pos = (D, U); interact = false; thickness = 3.5; color = #f59e0b }

new UI { name = "sTh"; type = slider; label = "наклон l, °"; variable = th; min = 0; max = 60; step = 1; default = 20 }
new UI { name = "sPs"; type = slider; label = "направление наклона, °"; variable = ps; min = 0; max = 360; step = 5; default = 30 }
new UI { name = "sChi"; type = slider; label = "поворот m в α, °"; variable = chi; min = 0; max = 180; step = 1; default = 50 }

string info = "";
float th = 20; float ps = 30; float chi = 50;

Function ang(dx, dy, dz, ex, ey, ez) {
  float c = abs(dx * ex + dy * ey + dz * ez);
  if (c > 1) { c = 1; }
  return acos(c) * 57.29578;
}

Update {
  float dx = sin(radians(th)) * cos(radians(ps));
  float dy = cos(radians(th));
  float dz = sin(radians(th)) * sin(radians(ps));
  U.pos.x = 3.5 * dx; U.pos.y = 3.5 * dy; U.pos.z = 3.5 * dz;
  D.pos.x = -2.5 * dx; D.pos.y = -2.5 * dy; D.pos.z = -2.5 * dz;
  float cx = cos(radians(chi)); float cz = sin(radians(chi));
  M1.pos.x = -3 * cx; M1.pos.z = -3 * cz;
  M2.pos.x = 3 * cx; M2.pos.z = 3 * cz;

  float a1 = ang(dx, dy, dz, 1, 0, 0);
  float a2 = ang(dx, dy, dz, 0, 0, 1);
  float am = ang(dx, dy, dz, cx, 0, cz);
  info = "**Перпендикулярность прямой и плоскости.** Прямая l перпендикулярна плоскости α, если она образует прямой угол с каждой прямой плоскости α, проходящей через точку O их пересечения.\n\nУглы с l: (l, m₁) = " + format(a1, 1) + "°, (l, m₂) = " + format(a2, 1) + "°, (l, m) = " + format(am, 1) + "°.";
  if (th == 0) { info = info + " **Все углы прямые при любом положении m — l ⊥ α.**"; }
  else { info = info + " Прямая l наклонна: нашлись прямые плоскости α, не перпендикулярные ей, — значит, l не перпендикулярна α."; }
}
]
