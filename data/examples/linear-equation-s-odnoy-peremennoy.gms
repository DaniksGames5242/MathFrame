[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = -3; float x_root = 0; string info = "";
func f(x) = a * x + b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = abs(a) >= 0.05 }
new UI { type = slider; label = "a"; variable = a; min = -4; max = 4; step = 0.2; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = -6; max = 6; step = 0.2; default = -3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return " − " + format(-x, d); } return " + " + format(x, d); }
Update {
  if (abs(a) < 0.05) { a = 0.2; }
  x_root = -b / a;
  if (abs(a) >= 0.05) { R1.pos.x = x_root; R1.pos.y = 0; info = "Уравнение " + format(a, 1) + "x" + term(b, 1) + " = 0. Корень x = " + num(x_root, 2) + "."; }
  else { info = "Коэффициент a близок к нулю — уравнение вырождается."; }
}
]
