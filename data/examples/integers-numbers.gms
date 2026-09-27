[
description = "{info}"
field width = 20; field height = 4;
camera type = fixed;
show axes = true;
float a = 4; string info = "";
new Point { name = "P"; pos = (4, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "Q"; pos = (-4, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "целое число a"; variable = a; min = -9; max = 9; step = 1; default = 4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  P.pos.x = a; Q.pos.x = -a;
  info = "**Целые числа** ℤ — точки на числовой прямой, равноудалённые друг от друга, с нулём в центре. Синяя точка — число a = " + num(a, 0) + ", оранжевая — противоположное ему число −a = " + num(-a, 0) + ".\n\nСумма противоположных чисел всегда равна нулю: a + (−a) = " + num(a + (-a), 0) + ".";
}
]
