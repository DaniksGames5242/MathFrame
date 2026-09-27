[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = 0; float c = 0; string info = "";
func f(x) = a * x * x + b * x + c;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = -2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -4; max = 4; step = 0.1; default = 0 }
new UI { type = slider; label = "c"; variable = c; min = -5; max = 5; step = 0.1; default = 0 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return " − " + format(-x, d); } return " + " + format(x, d); }
Update {
  if (abs(a) < 0.05) { a = 0.1; }
  string dir = "ветви вверх"; if (a < 0) { dir = "ветви вниз"; }
  info = "y = " + num(a, 1) + "·x²" + term(b, 1) + "·x" + term(c, 1) + ": парабола с " + dir + ".";
}
]
