[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float h = 2; float k = 1; string info = "";
func f(x) = a * (x - h) * (x - h) + k;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = -2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "h (x-координата)"; variable = h; min = -5; max = 5; step = 0.1; default = 2 }
new UI { type = slider; label = "k (y-координата)"; variable = k; min = -5; max = 5; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return " − " + format(-x, d); } return " + " + format(x, d); }
Update {
  if (abs(a) < 0.05) { a = 0.1; }
  info = "Вершина параболы y = " + num(a, 1) + "·(x" + term(-h, 1) + ")²" + term(k, 1) + " находится в точке (" + format(h, 1) + ", " + format(k, 1) + ").";
}
]
