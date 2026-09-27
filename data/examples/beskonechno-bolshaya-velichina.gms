[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float t = 2; string info = "";
func f(x) = 1 / x;
draw Function { name = "gr"; f = "f"; xmin = -6; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "x"; variable = t; min = -6; max = 6; step = 0.02; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(t) < 0.05) { t = 0.05; }
  float v = 1 / t; float yy = v; if (yy > 4) { yy = 4; } if (yy < -4) { yy = -4; }
  P.pos.x = t; P.pos.y = yy;
  info = "**Бесконечно большая величина** f(x) = 1/x при x → 0 растёт по модулю неограниченно: для любого сколь угодно большого M найдётся x, при котором |f(x)| > M.\n\nПри x = " + num(t, 2) + ": f(x) = " + num(v, 2) + ".";
}
]
