[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k = 6; string info = "";
func f(x) = k / x;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "k"; variable = k; min = 2; max = 10; step = 0.2; default = 6 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "Гипербола y = " + format(k, 1) + "/x имеет асимптоты: x = 0 (ось y) и y = 0 (ось x).";
}
]
