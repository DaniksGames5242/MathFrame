[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float t = 2; string info = "";
func f(x) = (x * x - 1) / (x - 1 + 0.0000001);
draw Function { name = "gr"; f = "f"; xmin = -6; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "x"; variable = t; min = -4; max = 4; step = 0.02; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(t - 1) < 0.03) { t = 1.03; }
  float v = (t * t - 1) / (t - 1 + 0.0000001);
  P.pos.x = t; P.pos.y = v;
  info = "**Раскрытие неопределённости 0/0:** f(x) = (x² − 1)/(x − 1) при x = 1 даёт 0/0, но при x ≠ 1 верно f(x) = x + 1. Значит lim(x→1) f(x) = 1 + 1 = 2 — точка (1; 2) выколота, но предел существует.\n\nПри x = " + num(t, 2) + ": f(x) = " + num(v, 2) + ".";
}
]
