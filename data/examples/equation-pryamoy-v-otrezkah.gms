[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 3; float b = 2; string info = "";
func f(x) = b * (1 - x / a);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 5; step = 0.1; default = 3 }
new UI { type = slider; label = "b"; variable = b; min = 0.5; max = 5; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "**x/a + y/b = 1** при a = " + format(a, 1) + ", b = " + format(b, 1) + ": прямая пересекает ось x в точке (" + format(a, 1) + "; 0) и ось y в точке (0; " + format(b, 1) + ").";
}
]
