[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float c = 0; string info = "";
func f(x) = pi / 2 - atan(x / a) + c;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "c"; variable = c; min = -2; max = 2; step = 0.1; default = 0 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return " − " + format(-x, d); } return " + " + format(x, d); }
Update {
  info = "**y = arcctg(x/" + format(a, 1) + ")" + term(c, 1) + "** — обратная функция котангенсу. Область определения: ℝ, область значений: (" + num(c, 1) + ", " + num(pi + c, 2) + "). Непрерывная и убывающая.";
}
]
