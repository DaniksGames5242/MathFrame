[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float m = 3; string info = "";
func f(x) = m * x;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "коэффициент"; variable = m; min = 0.5; max = 5; step = 0.1; default = 3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "Прямая пропорциональная зависимость: y = " + format(m, 1) + "·x, где " + format(m, 1) + " — коэффициент пропорциональности.";
}
]
