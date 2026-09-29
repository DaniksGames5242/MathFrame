[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (30, 70);
camera start zoom = 1.3;

// ---- Сфера радиуса R с центром O (тонкая) и поверхность, заметённая вращающейся полуокружностью (синяя) ----
draw Surface { name = "sph"; type = parametric; x = "R * sin(pi * u) * cos(6.283185 * v)"; y = "R * cos(pi * u)"; z = "R * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 32; opacity = 0.1 }
draw Surface { name = "swept"; type = parametric; x = "R * sin(pi * u) * cos(psi * v)"; y = "R * cos(pi * u)"; z = "R * sin(pi * u) * sin(psi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; color = #3b82f6; opacity = 0.4; active = psi > 0.02 }
new Curve3D { name = "arc"; type = parametric; x = "R * sin(pi * t) * cos(psi)"; y = "R * cos(pi * t)"; z = "R * sin(pi * t) * sin(psi)"; segments = 60; color = #3b82f6; thickness = 4 }
new Point3D { name = "N"; pos = (0, 3, 0); dynamic = false; collision = false; text = true("A") }
new Point3D { name = "Sp"; pos = (0, -3, 0); dynamic = false; collision = false; text = true("B") }
new Line3D { name = "dia"; pos = (N, Sp); interact = false; thickness = 2 }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M"); color = #f59e0b }
new Line3D { name = "om"; pos = (O, M); interact = false; thickness = 3; color = #f59e0b }

new UI { name = "sR"; type = slider; label = "радиус R"; variable = R; min = 1.5; max = 3; step = 0.1; default = 2.5 }
new UI { name = "sP"; type = slider; label = "поворот полуокружности, °"; variable = deg; min = 0; max = 360; step = 5; default = 120 }
new UI { name = "sD"; type = slider; label = "расстояние OM"; variable = rho; min = 0; max = 4.2; step = 0.05; default = 1.5 }
new UI { name = "sA"; type = slider; label = "азимут M, °"; variable = az; min = 0; max = 360; step = 5; default = 40 }
new UI { name = "sB"; type = slider; label = "высота M, °"; variable = el; min = -90; max = 90; step = 5; default = 25 }

// ---- Логика ----
float R = 2.5; float deg = 120; float psi = 2.09; float rho = 1.5; float az = 40; float el = 25;
string info = "";

Update {
  psi = radians(deg);
  N.pos.x = 0; N.pos.y = R; N.pos.z = 0;
  Sp.pos.x = 0; Sp.pos.y = -R; Sp.pos.z = 0;
  M.pos.x = rho * cos(radians(el)) * cos(radians(az));
  M.pos.y = rho * sin(radians(el));
  M.pos.z = rho * cos(radians(el)) * sin(radians(az));
  info = "**Сфера** — множество точек пространства, равноудалённых от фиксированной точки O (центра); расстояние R = " + format(R, 1) + " — радиус. **Шар** — сфера вместе со всеми точками внутри неё.\n\n";
  info = info + "Точка M: OM = " + format(rho, 2) + " при R = " + format(R, 1) + " — ";
  if (abs(rho - R) < 0.001) { info = info + "**на сфере** (OM = R)."; }
  if (rho < R - 0.001) { info = info + "внутри шара (OM < R), на сфере не лежит."; }
  if (rho > R + 0.001) { info = info + "вне шара (OM > R)."; }
  info = info + "\n\nСфера — тело вращения: полуокружность AB (синяя) радиуса R вращается вокруг своего диаметра AB, концы A и B остаются неподвижными. Повёрнута на " + format(deg, 0) + "°";
  if (deg > 359.5) { info = info + " — поверхность замкнулась, получилась вся сфера, без рёбер и вершин."; } else { info = info + " из 360°."; }
}
]
