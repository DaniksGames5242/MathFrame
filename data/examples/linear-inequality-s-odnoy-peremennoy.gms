[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = -4; string info = "";
func f(x) = a * x + b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = abs(a) > 0.05 }
new UI { type = slider; label = "коэффициент a"; variable = a; min = 0.1; max = 5; step = 0.1; default = 2 }
new UI { type = slider; label = "константа b"; variable = b; min = -8; max = 8; step = 0.2; default = -4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a) > 0.05) {
    float x1 = -b / a;
    R1.pos.x = x1; R1.pos.y = 0;
    info = "Неравенство: " + format(a, 1) + "x + (" + num(b, 1) + ") > 0. Корень x = " + num(x1, 2) + ". Решение: **x > " + num(x1, 2) + "**.";
  }
}
]
