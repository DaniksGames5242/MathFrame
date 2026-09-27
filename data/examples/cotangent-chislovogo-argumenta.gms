[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float t = 1; string info = "";
func ct(x) = cos(x) / sin(x);
draw Function { name = "gr"; f = "ct"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (1, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "x"; variable = t; min = 0.2; max = 2.9; step = 0.05; default = 1 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  P.pos.x = t; P.pos.y = cos(t) / sin(t);
  info = "**Котангенс числового аргумента x** = cos x / sin x, не определён при x = πn, где sin x = 0 (видно по вертикальным асимптотам графика).\n\nПри x = " + num(t, 2) + ": ctg x = " + format(cos(t) / sin(t), 3) + ". Функция нечётна: ctg(−x) = −ctg x.";
}
]
