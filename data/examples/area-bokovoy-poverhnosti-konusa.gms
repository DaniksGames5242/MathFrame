[
description = "{info}"

field width = 15; field height = 7; field depth = 7;
show grid = false; show axes = false;
camera start rot = (0, 78);
camera start zoom = 2.0;

// ---- Конус: только боковая поверхность (синяя); основание конуса на y = −1.5 ----
draw Surface { name = "lat"; type = parametric; x = "-4.6 + r * (1 - u) * cos(6.283185 * v)"; y = "-1.5 + h * u"; z = "r * (1 - u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; color = #3b82f6; opacity = 0.6 }
new Curve3D { name = "rim"; type = parametric; x = "-4.6 + r * cos(2 * pi * t)"; y = "-1.5"; z = "r * sin(2 * pi * t)"; segments = 96; thickness = 1 }
new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("S") }
new Point3D { name = "O"; pos = (-4.6, -1.5, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "B"; pos = (0, -1.5, 0); dynamic = false; collision = false; text = true("B") }
new Line3D { name = "hh"; pos = (S, O); interact = false; thickness = 2 }
new Line3D { name = "ll"; pos = (S, B); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "rr"; pos = (O, B); interact = false; thickness = 2 }

// ---- Развёртка: круговой сектор радиуса l с дугой 2πr ----
draw Surface { name = "sec"; type = parametric; x = "1.6 + l * u * sin(phi * (v - 0.5))"; y = "-l * u * cos(phi * (v - 0.5))"; z = "0"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; color = #3b82f6; opacity = 0.6 }

new UI { name = "sR"; type = slider; label = "радиус основания r"; variable = r; min = 0.8; max = 1.8; step = 0.05; default = 1.3 }
new UI { name = "sL"; type = slider; label = "образующая l"; variable = l; min = 2; max = 3.4; step = 0.05; default = 2.9 }

float r = 1.3; float l = 2.9; float h = 2.6; float phi = 2.8;
string info = "";

Update {
  // l > r всегда: ползунки не дают l ≤ r (min l = 2 > max r = 1.8)
  h = sqrt(l * l - r * r);
  phi = 2 * pi * r / l;
  S.pos.x = -4.6; S.pos.y = -1.5 + h; S.pos.z = 0;
  B.pos.x = -4.6 + r; B.pos.y = -1.5; B.pos.z = 0;
  float sb = pi * r * l;
  info = "**Площадь боковой поверхности конуса** — площадь кругового сектора, в который она разворачивается. Радиус сектора равен образующей l = " + format(l, 2) + ", длина дуги — длине окружности основания 2πr = " + format(2 * pi * r, 2) + ".\n\n";
  info = info + "Сектор с дугой 2πr и радиусом l составляет долю r / l = " + format(r / l, 3) + " круга радиуса l, его угол " + format(phi * 180 / pi, 1) + "°. Поэтому S_бок = π l² · r / l = **πrl = " + format(sb, 2) + "**.\n\n";
  info = info + "При фиксированной l площадь линейно растёт с r, при фиксированном r — линейно с l. Высота h = √(l² − r²) = " + format(h, 2) + ".";
}
]
