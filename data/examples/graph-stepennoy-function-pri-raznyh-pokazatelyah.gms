[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = 1; string info = "";
func f(x) = pow(x, a);
draw Function { name = "gr"; f = "f"; xmin = 0.001; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "показатель"; variable = a; min = 0.5; max = 4; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "**y = xᵃ** при показателе a = " + format(a, 1) + ": " + (a > 1 ? "возрастает" : "убывает") + ".";
}
]
