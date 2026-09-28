[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 62);
camera start zoom = 1.1;

// Плоскость α через начало координат O с единичной нормалью n (наклон θ и направление ψ —
// ползунки). Две прямые l₁, l₂ перпендикулярны α в точках K₁, K₂; точка T перетаскивается,
// H — основание перпендикуляра из T на α.
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "Pu"; pos = (1, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Pv"; pos = (0, 0, 1); dynamic = false; collision = false; active = false }
new Point3D { name = "K1"; pos = (-1, 0, -1); dynamic = false; collision = false; text = true("K₁") }
new Point3D { name = "K2"; pos = (1, 0, 1); dynamic = false; collision = false; text = true("K₂") }
new Point3D { name = "N1"; pos = (-1, 2.5, -1); dynamic = false; collision = false; active = false }
new Point3D { name = "N2"; pos = (1, 2.5, 1); dynamic = false; collision = false; active = false }
new Point3D { name = "F1"; pos = (-1, -2.5, -1); dynamic = false; collision = false; active = false }
new Point3D { name = "F2"; pos = (1, -2.5, 1); dynamic = false; collision = false; active = false }
new Point3D { name = "T"; pos = (2.5, 2.5, -1.5); text = true("T"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "H"; pos = (2.5, 0, -1.5); dynamic = false; collision = false; text = true("H"); color = #f59e0b }

draw InfPlane { name = "planeA"; points = (O, Pu, Pv); size = 3.6; opacity = 0.22; color = #3b82f6 }
new Line3D { name = "l1"; pos = (F1, N1); interact = false; thickness = 3.5; color = #22c55e }
new Line3D { name = "l2"; pos = (F2, N2); interact = false; thickness = 3.5; color = #22c55e }
new Line3D { name = "th"; pos = (T, H); interact = false; thickness = 3; color = #f59e0b }

new UI { name = "sTh"; type = slider; label = "наклон плоскости θ, °"; variable = th; min = 0; max = 50; step = 1; default = 20 }
new UI { name = "sPs"; type = slider; label = "направление наклона ψ, °"; variable = ps; min = 0; max = 360; step = 5; default = 30 }
new UI { name = "sS"; type = slider; label = "расстояние K₁K₂"; variable = ss; min = 1; max = 5; step = 0.1; default = 2.8 }

string info = "";
float th = 20; float ps = 30; float ss = 2.8;
float lim = 4.2;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function clampv(x) { if (x > lim) { return lim; } if (x < -lim) { return -lim; } return x; }

Update {
  float ct = cos(radians(th)); float st = sin(radians(th));
  float cp = cos(radians(ps)); float sp = sin(radians(ps));
  // Нормаль n и два единичных вектора u, v в плоскости α.
  float nx = st * cp; float ny = ct; float nz = st * sp;
  float ux = ct * cp; float uy = -st; float uz = ct * sp;
  float vx = -sp; float vz = cp;
  Pu.pos.x = ux; Pu.pos.y = uy; Pu.pos.z = uz;
  Pv.pos.x = vx; Pv.pos.y = 0; Pv.pos.z = vz;
  K1.pos.x = -ss / 2 * vx; K1.pos.y = 0; K1.pos.z = -ss / 2 * vz;
  K2.pos.x = ss / 2 * vx + 0.9 * ux; K2.pos.y = 0.9 * uy; K2.pos.z = ss / 2 * vz + 0.9 * uz;
  N1.pos.x = K1.pos.x + 2.5 * nx; N1.pos.y = K1.pos.y + 2.5 * ny; N1.pos.z = K1.pos.z + 2.5 * nz;
  F1.pos.x = K1.pos.x - 2.5 * nx; F1.pos.y = K1.pos.y - 2.5 * ny; F1.pos.z = K1.pos.z - 2.5 * nz;
  N2.pos.x = K2.pos.x + 2.5 * nx; N2.pos.y = K2.pos.y + 2.5 * ny; N2.pos.z = K2.pos.z + 2.5 * nz;
  F2.pos.x = K2.pos.x - 2.5 * nx; F2.pos.y = K2.pos.y - 2.5 * ny; F2.pos.z = K2.pos.z - 2.5 * nz;

  if (abs(T.pos.x) > lim) { T.pos.x = clampv(T.pos.x); }
  if (abs(T.pos.y) > lim) { T.pos.y = clampv(T.pos.y); }
  if (abs(T.pos.z) > lim) { T.pos.z = clampv(T.pos.z); }
  float s = T.pos.x * nx + T.pos.y * ny + T.pos.z * nz;
  H.pos.x = T.pos.x - s * nx; H.pos.y = T.pos.y - s * ny; H.pos.z = T.pos.z - s * nz;

  info = "**Свойства перпендикулярности прямой и плоскости.** Две прямые l₁ и l₂, перпендикулярные одной плоскости α, параллельны: оба направляющих вектора коллинеарны нормальному вектору плоскости n = (A; B; C) = (" + num(nx, 2) + "; " + num(ny, 2) + "; " + num(nz, 2) + "), а при параллельном переносе направление не меняется.\n\nРасстояние от точки T(" + num(T.pos.x, 1) + "; " + num(T.pos.y, 1) + "; " + num(T.pos.z, 1) + ") до плоскости — длина перпендикуляра TH: d = |Ax₀ + By₀ + Cz₀| / √(A² + B² + C²) = |" + num(s, 2) + "| / 1 = " + format(abs(s), 2) + ".";
}
]
