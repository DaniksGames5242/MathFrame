[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 70);
camera start zoom = 1.2;

// ---- Сфера радиуса R = 3 с центром O; плоскость на расстоянии d от центра с нормалью n ----
draw Surface { name = "sph"; type = parametric; x = "3 * sin(pi * u) * cos(6.283185 * v)"; y = "3 * cos(pi * u)"; z = "3 * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 32; color = #3b82f6; opacity = 0.35 }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "T"; pos = (0, 3, 0); dynamic = false; collision = false; text = true("T"); color = #f59e0b }
new Point3D { name = "H"; pos = (0, 3, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "U"; pos = (1, 3, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "W"; pos = (0, 3, 1); dynamic = false; collision = false; active = false }
draw InfPlane { name = "pl"; points = (H, U, W); size = 3.4; opacity = 0.3; color = #f59e0b }
new Line3D { name = "ot"; pos = (O, T); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "oh"; pos = (O, H); interact = false; thickness = 2 }
new Curve3D { name = "sec"; type = parametric; x = "hx + ss * (cos(6.283185 * t) * e1x + sin(6.283185 * t) * e2x)"; y = "hy + ss * (sin(6.283185 * t) * e2y)"; z = "hz + ss * (cos(6.283185 * t) * e1z + sin(6.283185 * t) * e2z)"; segments = 90; color = #f59e0b; thickness = 4; active = ss > 0.02 }

new UI { name = "sA"; type = slider; label = "азимут точки T, °"; variable = az; min = 0; max = 360; step = 5; default = 120 }
new UI { name = "sB"; type = slider; label = "высота точки T, °"; variable = el; min = -80; max = 80; step = 5; default = 30 }
new UI { name = "sD"; type = slider; label = "расстояние d от центра до плоскости"; variable = d; min = 1; max = 4.5; step = 0.1; default = 3 }

// ---- Логика ----
float az = 120; float el = 30; float d = 3;
float hx = 0; float hy = 3; float hz = 0; float ss = 0;
float e1x = 1; float e1z = 0; float e2x = 0; float e2y = 1; float e2z = 0;
string info = "";

Function num(x, dd) { if (x < 0) { return "−" + format(-x, dd); } return format(x, dd); }
Function term(c, v) { if (c < 0) { return " − " + format(-c, 2) + v; } return " + " + format(c, 2) + v; }

Update {
  float a = radians(az); float b = radians(el);
  float nx = cos(b) * cos(a); float ny = sin(b); float nz = cos(b) * sin(a);
  e1x = -sin(a); e1z = cos(a);
  e2x = -sin(b) * cos(a); e2y = cos(b); e2z = -sin(b) * sin(a);
  T.pos.x = 3 * nx; T.pos.y = 3 * ny; T.pos.z = 3 * nz;
  hx = d * nx; hy = d * ny; hz = d * nz;
  H.pos.x = hx; H.pos.y = hy; H.pos.z = hz;
  U.pos.x = hx + e1x; U.pos.y = hy; U.pos.z = hz + e1z;
  W.pos.x = hx + e2x; W.pos.y = hy + e2y; W.pos.z = hz + e2z;
  ss = 0;
  if (d < 2.999) { ss = sqrt(9 - d * d); }
  string eq = num(3 * nx, 2) + "x" + term(3 * ny, "y") + term(3 * nz, "z") + " = " + format(3 * d, 2);
  info = "**Касательная плоскость** имеет со сферой ровно одну общую точку — точку касания T. Радиус OT, проведённый в точку касания, перпендикулярен плоскости, а расстояние от центра до плоскости равно радиусу.\n\n";
  info = info + "Сфера радиуса R = 3, плоскость перпендикулярна прямой OT на расстоянии d = " + format(d, 1) + " от центра O:  ";
  if (d > 3.001) { info = info + "**d > R** — общих точек нет, плоскость проходит мимо сферы."; }
  if (d < 2.999) { info = info + "**d < R** — плоскость пересекает сферу по окружности радиуса √(R² − d²) = " + format(ss, 2) + " (жёлтая); плоскость не касательная."; }
  if (d >= 2.999) { if (d <= 3.001) { info = info + "**d = R** — общая точка одна (T), плоскость касательная."; } }
  info = info + "\n\nУравнение плоскости в координатах с началом в O: x₀x + y₀y + z₀z = R·d, где T(x₀; y₀; z₀) = (" + num(3 * nx, 2) + "; " + num(3 * ny, 2) + "; " + num(3 * nz, 2) + "):  " + eq + ".";
  if (d >= 2.999) { if (d <= 3.001) { info = info + " Правая часть равна R² = 9 — это касательная плоскость."; } }
}
]
