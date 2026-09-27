[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = 1; string info = "";
func f(x) = pow(a, x);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = 1.1; max = 4; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "**y = aˣ** показательная функция с основанием a = " + format(a, 1) + ".";
}
]
