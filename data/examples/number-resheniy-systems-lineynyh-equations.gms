[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k2 = 1.5; float b2 = 2; string info = "";
func f(x) = 2 * x + 1;
func g(x) = k2 * x + b2;
draw Function { name = "g0"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #f59e0b; thickness = 2 }
draw Function { name = "g1"; f = "g"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "k₂"; variable = k2; min = 0.5; max = 3; step = 0.1; default = 1.5 }
new UI { type = slider; label = "b₂"; variable = b2; min = -5; max = 5; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  string result = "одно решение"; if (abs(k2 - 2) < 0.05) { result = abs(b2 - 1) < 0.05 ? "бесконечное число решений" : "нет решений"; }
  info = "Система: y = 2x + 1 (оранжевая) и y = " + format(k2, 1) + "x " + (b2 >= 0 ? "+ " : "− ") + format(abs(b2), 1) + " (синяя). Число решений: " + result + ".";
}
]
