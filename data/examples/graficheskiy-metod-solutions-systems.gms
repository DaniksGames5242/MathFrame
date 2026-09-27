[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; string info = "";
func f(x) = -x + 3;
func g(x) = a * x - 1;
draw Function { name = "g0"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #f59e0b; thickness = 2 }
draw Function { name = "g1"; f = "g"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "коэффициент a"; variable = a; min = -3; max = 3; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  string s = "имеют "; if (abs(a + 1) < 0.05) { s = "совпадают и "; }
  info = "Система: y = −x + 3 (оранжевая) и y = " + format(a, 1) + "x − 1 (синяя). Прямые " + s + (abs(a + 1) < 0.05 ? "бесконечное число решений." : "пересекаются в одной точке, откуда находится единственное решение (x; y).");
}
]
