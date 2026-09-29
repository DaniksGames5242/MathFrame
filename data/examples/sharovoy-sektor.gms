[
description = "{info}"

field width = 8;
field height = 8;
field depth = 8;
show grid = false;
show axes = false;

// ---- Шар R = 3; коническая поверхность с вершиной в центре O вырезает сектор с углом β при оси ----
new Primitive { name = "ball"; type = sphere; pos = (0, 0, 0); radius = 3; opacity = 0.1; color = #3b82f6 }
draw Surface { name = "cap"; type = parametric; x = "3 * sin(be * u) * cos(2 * pi * v)"; y = "3 * cos(be * u)"; z = "3 * sin(be * u) * sin(2 * pi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 40; color = #f59e0b; opacity = 0.7 }
draw Surface { name = "cone"; type = parametric; x = "3 * u * sin(be) * cos(2 * pi * v)"; y = "3 * u * cos(be)"; z = "3 * u * sin(be) * sin(2 * pi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; color = #3b82f6; opacity = 0.4 }
new Curve3D { name = "rim"; type = parametric; x = "3 * sin(be) * cos(2 * pi * t)"; y = "3 * cos(be)"; z = "3 * sin(be) * sin(2 * pi * t)"; segments = 100; color = #f59e0b; thickness = 4 }

new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; text = true("O") }
new Point3D { name = "P"; pos = (0, 3, 0); dynamic = false; text = true("P") }
new Point3D { name = "M"; pos = (2, 2, 0); dynamic = false; text = true("M") }
new Line3D { name = "op"; pos = (O, P); color = #22c55e; thickness = 4 }
new Line3D { name = "om"; pos = (O, M); thickness = 2 }

new UI { name = "sB"; type = slider; label = "угол β°"; variable = deg; min = 5; max = 175; step = 1; default = 50 }

float R = 3;
float deg = 50;
float be = 0.87;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  be = radians(deg);
  M.pos.x = R * sin(be); M.pos.y = R * cos(be);
  float h = R * (1 - cos(be));
  float S = 2 * pi * R * h;
  float V = 2 * pi * R * R * h / 3;
  float Vk = pi * pow(R * sin(be), 2) * R * cos(be) / 3;
  float Vs = pi * h * h * (R - h / 3);
  info = "**Шаровой сектор** получается вращением кругового сектора с углом β = " + format(deg, 0) + "° при вершине O (в центре шара) вокруг радиуса OP. Радиус шара R = 3, высота сегмента h = R(1 − cos β) = " + format(h, 2) + ".\n\nОбъём V = ⅔πR²h = " + format(V, 2) + ", площадь сферической части S = 2πRh = " + format(S, 2) + ", поэтому V = ⅓SR. Сектор занимает долю " + format(100 * h / (2 * R), 1) + " % шара.\n\nСостав: конус + сегмент = " + num(Vk, 2) + " + " + format(Vs, 2) + " = " + format(Vk + Vs, 2) + ".";
  if (deg > 89.5 && deg < 90.5) { info = info + " При β = 90° конус вырождается в плоскость, сектор — полушар."; }
  if (deg > 90.5) { info = info + " При β > 90° объём конуса отрицателен: сегмент дополняется вырезанным конусом."; }
}
]
