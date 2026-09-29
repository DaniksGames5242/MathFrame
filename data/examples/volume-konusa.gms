[
description = "{info}"

field width = 8; field height = 8; field depth = 8;
show grid = false; show axes = false;
camera start rot = (25, 68);
camera start zoom = 1.1;

// ---- Прямой круговой конус (синий) внутри описанного цилиндра (тонкий): основание y = −3 ----
draw Surface { name = "cone"; type = parametric; x = "r * (1 - u) * cos(6.283185 * v)"; y = "-3 + h * u"; z = "r * (1 - u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; color = #3b82f6; opacity = 0.55 }
draw Surface { name = "base"; type = parametric; x = "r * u * cos(6.283185 * v)"; y = "-3"; z = "r * u * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 20; color = #3b82f6; opacity = 0.35 }
draw Surface { name = "cyl"; type = parametric; x = "r * cos(6.283185 * v)"; y = "-3 + h * u"; z = "r * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; opacity = 0.12 }
draw Surface { name = "top"; type = parametric; x = "r * u * cos(6.283185 * v)"; y = "-3 + h"; z = "r * u * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 20; opacity = 0.12 }

// ---- Сечения на расстоянии x от вершины: круг цилиндра (зелёный) и круг конуса (жёлтый) ----
new Curve3D { name = "secCyl"; type = parametric; x = "r * cos(6.283185 * t)"; y = "-3 + h - xs"; z = "r * sin(6.283185 * t)"; segments = 90; color = #22c55e; thickness = 3 }
new Curve3D { name = "secCone"; type = parametric; x = "rs * cos(6.283185 * t)"; y = "-3 + h - xs"; z = "rs * sin(6.283185 * t)"; segments = 90; color = #f59e0b; thickness = 4 }
new Point3D { name = "A"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("S") }
new Point3D { name = "O"; pos = (0, -3, 0); dynamic = false; collision = false; text = true("O") }
new Line3D { name = "ax"; pos = (A, O); interact = false; thickness = 2 }

new UI { name = "sR"; type = slider; label = "радиус r"; variable = r; min = 1; max = 3; step = 0.1; default = 2 }
new UI { name = "sH"; type = slider; label = "высота h"; variable = h; min = 1.5; max = 5.5; step = 0.1; default = 4 }
new UI { name = "sX"; type = slider; label = "x / h"; variable = q; min = 0; max = 1; step = 0.01; default = 0.5 }

// ---- Логика ----
float r = 2; float h = 4; float q = 0.5; float xs = 2; float rs = 1;
string info = "";

Update {
  xs = q * h;
  rs = r * q;
  A.pos.x = 0; A.pos.y = -3 + h; A.pos.z = 0;
  float sb = pi * r * r;
  float vc = sb * h / 3;
  info = "**Объём конуса** равен трети произведения площади основания на высоту: V = ⅓ S_осн · h = ⅓πr²h.\n\n";
  info = info + "r = " + format(r, 1) + ", h = " + format(h, 1) + ":   S_осн = πr² = " + format(sb, 2) + ",   V = " + format(vc, 2) + ".\n\n";
  info = info + "Описанный цилиндр (то же основание и та же высота) имеет объём πr²h = " + format(sb * h, 2) + ": конус занимает ровно треть, V_конуса : V_цилиндра = " + format(vc / (sb * h), 3) + ".\n\n";
  info = info + "Принцип Кавальери. На расстоянии x = " + format(xs, 2) + " от вершины сечение цилиндра — круг площади πr² = " + format(sb, 2) + " (зелёный), а сечение конуса — круг радиуса rx/h = " + format(rs, 2) + " и площади π(rx/h)² = " + format(pi * rs * rs, 2) + " (жёлтый). Площадь сечения конуса растёт как x², поэтому V = ∫₀ʰ π(rx/h)² dx = ⅓πr²h.";
}
]
