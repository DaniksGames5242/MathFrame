[
description = "{info}"

field width = 8;
field height = 8;
field depth = 8;
show grid = false;
show axes = false;

// ---- Шар радиуса R = 3 с центром O; секущая плоскость y = R − h отсекает сегмент высоты h ----
new Primitive { name = "ball"; type = sphere; pos = (0, 0, 0); radius = 3; opacity = 0.12; color = #3b82f6 }
draw Surface { name = "cap"; type = parametric; x = "3 * sin(tm * u) * cos(2 * pi * v)"; y = "3 * cos(tm * u)"; z = "3 * sin(tm * u) * sin(2 * pi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 40; color = #f59e0b; opacity = 0.7 }
draw Surface { name = "cap2"; type = parametric; x = "3 * sin(tm + (pi - tm) * u) * cos(2 * pi * v)"; y = "3 * cos(tm + (pi - tm) * u)"; z = "3 * sin(tm + (pi - tm) * u) * sin(2 * pi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 40; color = #3b82f6; opacity = 0.35; active = second }
draw Surface { name = "base"; type = parametric; x = "rb * u * cos(2 * pi * v)"; y = "yb"; z = "rb * u * sin(2 * pi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 20; color = #f59e0b; opacity = 0.45 }
new Curve3D { name = "rim"; type = parametric; x = "rb * cos(2 * pi * t)"; y = "yb"; z = "rb * sin(2 * pi * t)"; segments = 100; color = #f59e0b; thickness = 4 }

new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; text = true("O") }
new Point3D { name = "H"; pos = (0, 1, 0); dynamic = false; text = true("O₁") }
new Point3D { name = "P"; pos = (0, 3, 0); dynamic = false; text = true("P") }
new Point3D { name = "M"; pos = (2, 1, 0); dynamic = false; text = true("M") }
new Line3D { name = "om"; pos = (O, M); thickness = 2 }
new Line3D { name = "hm"; pos = (H, M); color = #f59e0b; thickness = 3 }
new Line3D { name = "hp"; pos = (H, P); color = #22c55e; thickness = 4 }
new Line3D { name = "oh"; pos = (O, H); thickness = 2 }

new UI { name = "sH"; type = slider; label = "высота h"; variable = h; min = 0.1; max = 5.9; step = 0.05; default = 2 }
new UI { name = "tS"; type = toggle; label = "второй сегмент"; variable = second; default = false }

float R = 3;
float h = 2;
bool second = false;
float tm = 1.2; float rb = 2.2; float yb = 1;
string info = "";

Update {
  yb = R - h;
  tm = acos(yb / R);
  rb = sqrt(h * (2 * R - h));
  H.pos.y = yb; P.pos.y = R; M.pos.x = rb; M.pos.y = yb;
  float d = abs(R - h);
  float V = pi * h * h * (R - h / 3);
  info = "**Шаровой сегмент**: часть шара, отсечённая плоскостью. Высота h = " + format(h, 2) + " — расстояние от плоскости основания до полюса P; радиус шара R = 3.\n\nРадиус основания: r² = R² − d² = h(2R − h), где d = " + format(d, 2) + " — расстояние от центра до плоскости, откуда r = " + format(rb, 2) + ".\n\nОбъём V = πh²(R − h/3) = " + format(V, 2) + ", площадь сферической части S = 2πRh = " + format(2 * pi * R * h, 2) + ".";
  if (abs(h - R) < 0.03) { info = info + "\n\nh = R: плоскость проходит через центр, сегмент — полушар."; }
  if (h < R - 0.03) { info = info + "\n\nh < R — малый сегмент."; }
  if (h > R + 0.03) { info = info + "\n\nh > R — большой сегмент."; }
  if (second) { info = info + " Второй сегмент имеет высоту 2R − h = " + format(2 * R - h, 2) + ": сумма высот равна диаметру."; }
}
]
