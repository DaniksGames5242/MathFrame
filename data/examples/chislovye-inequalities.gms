[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float c = 3; string info = "";
func f(x) = 2 * x - c;
draw Function { name = "gf"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "c"; variable = c; min = -6; max = 6; step = 0.5; default = 3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float x0 = c / 2; R.pos.x = x0; R.pos.y = 0;
  info = "**Числовое неравенство 2x − " + format(c, 1) + " > 0** равносильно 2x > " + format(c, 1) + ", то есть x > " + num(x0, 2) + ".\n\nОранжевая точка — граница x = " + num(x0, 2) + " (не входит в решение); правее неё график лежит выше оси Ox — там неравенство выполняется.";
}
]
