[
description = "{info}"

field width = 8; field height = 8; field depth = 8;
show grid = false; show axes = false;

// ---- Шар R = 3; сферическая часть границы — полоса между полярными углами ta и tb ----
new Primitive { name = "ball"; type = sphere; pos = (0, 0, 0); radius = 3; opacity = 0.1; color = #3b82f6 }
draw Surface { name = "zone"; type = parametric; x = "3 * sin(ta + (tb - ta) * u) * cos(2 * pi * v)"; y = "3 * cos(ta + (tb - ta) * u)"; z = "3 * sin(ta + (tb - ta) * u) * sin(2 * pi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 40; color = #f59e0b; opacity = 0.7 }
draw Surface { name = "cone"; type = parametric; x = "3 * u * sin(tb) * cos(2 * pi * v)"; y = "3 * u * cos(tb)"; z = "3 * u * sin(tb) * sin(2 * pi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; color = #3b82f6; opacity = 0.4; active = tab == 3 }
draw Surface { name = "baseA"; type = parametric; x = "rA * u * cos(2 * pi * v)"; y = "yA"; z = "rA * u * sin(2 * pi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 20; color = #22c55e; opacity = 0.4; active = tab < 3 }
draw Surface { name = "baseB"; type = parametric; x = "rB * u * cos(2 * pi * v)"; y = "yB"; z = "rB * u * sin(2 * pi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 20; color = #22c55e; opacity = 0.4; active = tab == 2 }
new Curve3D { name = "rimA"; type = parametric; x = "rA * cos(2 * pi * t)"; y = "yA"; z = "rA * sin(2 * pi * t)"; segments = 100; color = #22c55e; thickness = 3; active = tab != 3 }
new Curve3D { name = "rimB"; type = parametric; x = "rB * cos(2 * pi * t)"; y = "yB"; z = "rB * sin(2 * pi * t)"; segments = 100; color = #22c55e; thickness = 3; active = tab == 2 }

new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "P"; pos = (0, 3, 0); dynamic = false; collision = false; text = true("P") }
new Line3D { name = "op"; pos = (O, P); interact = false; thickness = 2 }

new UI { name = "bT1"; type = button; label = "Шаровой сегмент"; action = "tab = 1" }
new UI { name = "bT2"; type = button; label = "Шаровой слой"; action = "tab = 2" }
new UI { name = "bT3"; type = button; label = "Шаровой сектор"; action = "tab = 3" }
new UI { name = "sY1"; type = slider; label = "плоскость y₁"; variable = y1; min = -2.7; max = 2.9; step = 0.05; default = 1; active = tab < 3 }
new UI { name = "sY2"; type = slider; label = "плоскость y₂"; variable = y2; min = -2.9; max = y1 - 0.2; step = 0.05; default = -1; active = tab == 2 }
new UI { name = "sAl"; type = slider; label = "угол при вершине α, °"; variable = al; min = 10; max = 360; step = 5; default = 120; active = tab == 3 }

float R = 3; int tab = 1;
float y1 = 1; float y2 = -1; float al = 120;
float ta = 0; float tb = 1.2; float yA = 1; float yB = 0; float rA = 2.8; float rB = 0;
string info = "";

Function num(x) { if (x < 0) { return "(−" + format(abs(x), 2) + ")"; } return format(x, 2); }

Update {
  if (tab == 1) {
    ta = 0; tb = acos(y1 / R);
    yA = y1; rA = R * sin(tb); yB = R; rB = 0;
    float h = R - y1;
    info = "**Шаровой сегмент** — часть шара, отсекаемая плоскостью y = " + num(y1) + ". Высота h = " + format(h, 2) + " — расстояние от плоскости основания до полюса P; радиус основания r = " + format(rA, 2) + ", r² = h(2R − h).\n\nОбъём V = πh²(R − h/3) = " + format(pi * h * h * (R - h / 3), 2) + ", площадь сферической части (сегментная поверхность) S = 2πRh = " + format(2 * pi * R * h, 2) + ".";
    if (abs(h - R) < 0.03) { info = info + "\n\nh = R: плоскость проходит через центр, сегмент — полушар."; }
    if (h < R - 0.03) { info = info + "\n\nh < R — малый сегмент."; }
    if (h > R + 0.03) { info = info + "\n\nh > R — большой сегмент."; }
  }
  if (tab == 2) {
    ta = acos(y1 / R); tb = acos(y2 / R);
    yA = y2; rA = R * sin(tb); yB = y1; rB = R * sin(ta);
    float h = y1 - y2;
    float v = pi * h / 6 * (3 * rA * rA + 3 * rB * rB + h * h);
    info = "**Шаровой слой** — часть шара между параллельными плоскостями y = " + num(y1) + " и y = " + num(y2) + ". Высота слоя h = " + format(h, 2) + ", радиусы оснований R₁ = " + format(rB, 2) + " и R₂ = " + format(rA, 2) + ".\n\nОбъём V = πh/6 · (3R₁² + 3R₂² + h²) = " + format(v, 2) + ". Он равен разности объёмов большего сегмента (высота " + format(R - y2, 2) + ") и меньшего (высота " + format(R - y1, 2) + "), отсекаемых от верхнего полюса: " + format(pi * (R - y2) * (R - y2) * (R - (R - y2) / 3), 2) + " − " + format(pi * (R - y1) * (R - y1) * (R - (R - y1) / 3), 2) + " = " + format(v, 2) + ".\n\nПлощадь шарового пояса S = 2πRh = " + format(2 * pi * R * h, 2) + " — зависит только от высоты, а не от положения слоя.";
  }
  if (tab == 3) {
    ta = 0; tb = al * pi / 360;
    yA = 0; rA = 0; yB = 0; rB = 0;
    float k = 1 - cos(tb);
    info = "**Шаровой сектор** — тело, ограниченное конической поверхностью с вершиной в центре O и частью сферы; угол при вершине α = " + format(al, 0) + "°.\n\nОбъём V = ⅔πR³(1 − cos(α/2)) = " + format(2 * pi * R * R * R * k / 3, 2) + ", площадь сферической части S = 2πR²(1 − cos(α/2)) = " + format(2 * pi * R * R * k, 2) + "; V = ⅓ S · R.\n\nСектор = конус + шаровой сегмент с общим основанием, вершина конуса в центре шара.";
    if (abs(al - 180) < 2.6) { info = info + " При α = 180° сектор — полушар."; }
    if (al > 358) { info = info + " При α = 360° сектор — весь шар."; }
  }
}
]
