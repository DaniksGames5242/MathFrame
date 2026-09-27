[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a = -2; string info = "";
func f(x) = (x - 1) / (x - a);
draw Function { name = "gf"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (1, 0); dynamic = false; collision = false; color = #22c55e }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "a (ОДЗ: x ≠ a)"; variable = a; min = -7; max = -0.5; step = 0.5; default = -2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  R2.pos.x = a;
  string s1 = "(−∞; " + num(a, 1) + ")"; string s2 = "(1; +∞)";
  info = "**(x − 1)/(x − " + num(a, 1) + ") > 0.** ОДЗ: x ≠ " + num(a, 1) + " (оранжевая точка, знаменатель). Корень числителя x = 1 (зелёная точка).\n\nДробь положительна на " + s1 + " и на " + s2 + ", отрицательна между " + num(a, 1) + " и 1 — решение x ∈ " + s1 + " ∪ " + s2 + ".";
}
]
