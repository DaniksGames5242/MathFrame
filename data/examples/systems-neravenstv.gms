[
description = "{info}"
field width = 16; field height = 6;
camera type = fixed;
float a = -2; float b = 3; string info = "";
new Point { name = "A"; pos = (-2, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "B"; pos = (3, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "a (x > a)"; variable = a; min = -7; max = 7; step = 0.5; default = -2 }
new UI { type = slider; label = "b (x < b)"; variable = b; min = -7; max = 7; step = 0.5; default = 3 }
show axes = true;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  A.pos.x = a; B.pos.x = b;
  string r = "решение системы: x ∈ (" + num(a, 1) + "; " + num(b, 1) + ")"; if (a >= b) { r = "система несовместна: нет x, одновременно большего " + num(a, 1) + " и меньшего " + num(b, 1) + ""; }
  info = "**Система: x > a и x < b.** При a = " + num(a, 1) + ", b = " + num(b, 1) + " — " + r + ".";
}
]
