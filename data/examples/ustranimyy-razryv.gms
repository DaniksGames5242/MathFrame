[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float c = 0.4; string info = "";
Function f(x) { if (abs(x) < 0.0005) { return 1; } return sin(x) / x; }
draw Function { name = "gr"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0.4); dynamic = false; collision = false; color = #f59e0b; active = true }
new UI { type = slider; label = "значение в точке c"; variable = c; min = 0; max = 2; step = 0.05; default = 0.4 }
Update {
  R1.pos.x = 0; R1.pos.y = c;
  if (abs(c - 1) > 0.03) { info = "**Устранимый разрыв**: предел lim (sin x / x) при x → 0 равен 1, но в самой точке x = 0 значение задано равным c = " + format(c, 2) + " ≠ 1 — функция разрывна в этой точке, хотя предел существует."; }
  if (abs(c - 1) <= 0.03) { info = "Если положить c = 1 (как сейчас), значение в точке совпадает с пределом — разрыв **устранён**, функция непрерывна."; }
}
]
