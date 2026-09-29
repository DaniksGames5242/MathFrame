[
description = "{info}"

field width = 8;
field height = 8;
field depth = 8;
show grid = false;
show axes = false;

// ---- Шар R = 3; две параллельные плоскости y = a и y = b = a + h вырезают слой ----
new Primitive { name = "ball"; type = sphere; pos = (0, 0, 0); radius = 3; opacity = 0.1; color = #3b82f6 }
draw Surface { name = "belt"; type = parametric; x = "3 * sin(t1 + (t2 - t1) * u) * cos(2 * pi * v)"; y = "3 * cos(t1 + (t2 - t1) * u)"; z = "3 * sin(t1 + (t2 - t1) * u) * sin(2 * pi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 40; color = #f59e0b; opacity = 0.65 }
draw Surface { name = "lower"; type = parametric; x = "r1 * u * cos(2 * pi * v)"; y = "a"; z = "r1 * u * sin(2 * pi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 20; color = #f59e0b; opacity = 0.4 }
draw Surface { name = "upper"; type = parametric; x = "r2 * u * cos(2 * pi * v)"; y = "b"; z = "r2 * u * sin(2 * pi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 20; color = #f59e0b; opacity = 0.4 }
new Curve3D { name = "rim1"; type = parametric; x = "r1 * cos(2 * pi * t)"; y = "a"; z = "r1 * sin(2 * pi * t)"; segments = 100; color = #f59e0b; thickness = 4 }
new Curve3D { name = "rim2"; type = parametric; x = "r2 * cos(2 * pi * t)"; y = "b"; z = "r2 * sin(2 * pi * t)"; segments = 100; color = #f59e0b; thickness = 4 }

new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; text = true("O") }
new Point3D { name = "A"; pos = (0, -1, 0); dynamic = false; text = true("O₁") }
new Point3D { name = "B"; pos = (0, 1, 0); dynamic = false; text = true("O₂") }
new Line3D { name = "axis"; pos = (A, B); color = #22c55e; thickness = 4 }

new UI { name = "sA"; type = slider; label = "нижняя плоскость y"; variable = a; min = -3; max = 2.9; step = 0.05; default = -1 }
new UI { name = "sH"; type = slider; label = "высота h"; variable = h; min = 0.1; max = 3 - a; step = 0.05; default = 2 }

float R = 3;
float a = -1; float h = 2; float b = 1;
float r1 = 2.8; float r2 = 2.8; float t1 = 1.2; float t2 = 2;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  if (h > R - a) { h = R - a; }
  b = a + h;
  t1 = acos(b / R); t2 = acos(a / R);
  r1 = sqrt(max(R * R - a * a, 0)); r2 = sqrt(max(R * R - b * b, 0));
  A.pos.y = a; B.pos.y = b;
  float V = pi * h / 6 * (3 * r1 * r1 + 3 * r2 * r2 + h * h);
  info = "**Шаровой слой**: часть шара между двумя параллельными плоскостями, расстояние между ними — высота h = " + num(h, 2) + ". Плоскости на расстояниях " + num(a, 2) + " и " + num(b, 2) + " от центра O (R = 3).\n\nРадиусы оснований из теоремы Пифагора: r² = R² − d²: r₁ = " + format(r1, 2) + ", r₂ = " + format(r2, 2) + ".\n\nОбъём V = πh/6 · (3r₁² + 3r₂² + h²) = " + format(V, 2) + ", площадь пояса S = 2πRh = " + format(2 * pi * R * h, 2) + ".";
  if (a < 0 && b > 0) { info = info + "\n\nЦентр лежит между плоскостями — большой слой."; }
  if (a >= 0 || b <= 0) { info = info + "\n\nПлоскости по одну сторону от центра — малый слой."; }
  if (a < -2.97 || b > 2.97) { info = info + " Одна плоскость касается шара — слой превращается в шаровой сегмент."; }
  if (abs(a + b) < 0.03) { info = info + " Плоскости симметричны относительно центра."; }
}
]
