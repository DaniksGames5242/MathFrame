[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float t = 0; string info = "";
func f(x) = x * x * x - x;
func g(x) = -(x * x * x - x);
draw Function { name = "g0"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #f59e0b; thickness = 2 }
draw Function { name = "g1"; f = "g"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "отр."; variable = t; min = 0; max = 1; step = 1; default = 0 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "Оранжевый — y = x³ − x, синий отражён относительно оси абсцисс: y = −(x³ − x).";
}
]
