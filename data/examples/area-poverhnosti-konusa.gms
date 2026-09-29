[
description = "{info}"

field width = 15; field height = 7; field depth = 7;
show grid = false; show axes = false;
camera start rot = (0, 78);
camera start zoom = 2.0;

// ---- Конус: боковая (синяя) и основание (жёлтое) ----
draw Surface { name = "lat"; type = parametric; x = "-4.6 + r * (1 - u) * cos(6.283185 * v)"; y = "-1.5 + h * u"; z = "r * (1 - u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; color = #3b82f6; opacity = 0.6 }
draw Surface { name = "bas"; type = parametric; x = "-4.6 + r * u * cos(6.283185 * v)"; y = "-1.5"; z = "r * u * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 20; color = #f59e0b; opacity = 0.6 }
new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("S") }
new Point3D { name = "O"; pos = (-4.6, -1.5, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "B"; pos = (0, -1.5, 0); dynamic = false; collision = false; text = true("B") }
new Line3D { name = "hh"; pos = (S, O); interact = false; thickness = 2 }
new Line3D { name = "ll"; pos = (S, B); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "rr"; pos = (O, B); interact = false; thickness = 2 }

// ---- Развёртка поверхности: сектор (боковая) + круг (основание) ----
draw Surface { name = "sec"; type = parametric; x = "0.3 + l * u * sin(phi * (v - 0.5))"; y = "-l * u * cos(phi * (v - 0.5))"; z = "0"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; color = #3b82f6; opacity = 0.6 }
draw Surface { name = "disk"; type = parametric; x = "5.4 + r * u * cos(6.283185 * v)"; y = "r * u * sin(6.283185 * v)"; z = "0"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 20; color = #f59e0b; opacity = 0.6 }

new UI { name = "sR"; type = slider; label = "радиус основания r"; variable = r; min = 0.8; max = 1.6; step = 0.05; default = 1.3 }
new UI { name = "sH"; type = slider; label = "высота h"; variable = h; min = 1; max = 2.5; step = 0.05; default = 2 }

float r = 1.3; float h = 2; float l = 2.4; float phi = 3.4;
string info = "";

Update {
  l = sqrt(r * r + h * h);
  phi = 2 * pi * r / l;
  S.pos.x = -4.6; S.pos.y = -1.5 + h; S.pos.z = 0;
  B.pos.x = -4.6 + r; B.pos.y = -1.5; B.pos.z = 0;
  float sb = pi * r * l; float so = pi * r * r; float tot = sb + so;
  info = "**Площадь поверхности конуса** состоит из площади боковой поверхности (синяя) и площади основания (жёлтая): S = S_бок + S_осн.\n\n";
  info = info + "Образующая l = √(r² + h²) = √(" + format(r * r, 2) + " + " + format(h * h, 2) + ") = " + format(l, 2) + ". Боковая поверхность — сектор радиуса l с дугой 2πr, S_бок = πrl = **" + format(sb, 2) + "**; основание S_осн = πr² = **" + format(so, 2) + "**.\n\n";
  info = info + "Вместе S = πr(l + r) = **" + format(tot, 2) + "**; на боковую поверхность приходится " + format(100 * sb / tot, 1) + "%. Угол сектора развёртки " + format(phi * 180 / pi, 1) + "°.";
}
]
