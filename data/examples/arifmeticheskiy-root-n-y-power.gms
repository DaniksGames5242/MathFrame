[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 3; float b = 1; string info = "";
func f(x) = pow(x, 1/a);
draw Function { name = "gr"; f = "f"; xmin = 0.001; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "показатель"; variable = a; min = 2; max = 5; step = 1; default = 3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "**y = ᵃ√x** корень n-й степени при n = " + format(a, 1) + ".";
}
]
