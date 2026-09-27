[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k2 = 2; string info = "";
func f(x) = x + 1;
func g(x) = k2 * x - 1;
draw Function { name = "g0"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #f59e0b; thickness = 2 }
draw Function { name = "g1"; f = "g"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "k₂"; variable = k2; min = 0.5; max = 3; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(k2 - 1) < 0.05) { k2 = 1.1; }
  info = "Оранжевая — y = x + 1 (наклон 1), синяя — y = " + format(k2, 1) + "x − 1. Коэффициенты наклона различны при k ≠ 1.";
}
]
