[
description = "{info}"
field width = 16; field height = 6;
camera type = fixed;
float c = 1; string info = "";
new Point { name = "A"; pos = (3, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "B"; pos = (1, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "c"; variable = c; min = -3; max = 3; step = 0.1; default = 1 }
show axes = true;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  A.pos.x = 3 * c; B.pos.x = 1 * c;
  string rel = "A правее B: 3c > c"; if (c < -0.05) { rel = "A левее B: 3c < c — знак неравенства сменился"; } if (abs(c) <= 0.05) { rel = "обе точки сливаются в 0: 3c = c"; }
  info = "**a = 3, b = 1 (a > b).** При умножении обеих частей на c = " + format(c, 1) + " получаем 3·" + format(c, 1) + " (синяя точка) и 1·" + format(c, 1) + " (оранжевая точка). " + rel + ".";
}
]
