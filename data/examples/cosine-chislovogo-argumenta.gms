[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float t = 1; string info = "";
func c(x) = cos(x);
draw Function { name = "gr"; f = "c"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (0, 1); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "x"; variable = t; min = -6.5; max = 6.5; step = 0.1; default = 1 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  P.pos.x = t; P.pos.y = cos(t);
  info = "**Косинус числового аргумента x** — координата точки на единичной окружности при повороте на угол x радиан. При x = " + num(t, 2) + ": cos x = " + format(cos(t), 3) + ".\n\nЧётность: cos(−x) = cos x, поэтому cos(" + num(-t, 2) + ") = " + format(cos(-t), 3) + " — то же самое значение.";
}
]
