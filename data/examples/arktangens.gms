[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float c = 0; string info = "";
func f(x) = atan(x / a) + c;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "c"; variable = c; min = -2; max = 2; step = 0.1; default = 0 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "**y = arctan(x/" + format(a, 1) + ") + " + num(c, 1) + "** — обратная функция тангенсу. Область определения: ℝ, область значений: (−π/2, π/2). Нечётная.";
}
]
