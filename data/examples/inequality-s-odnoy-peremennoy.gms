[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = -2; string info = "";
func f(x) = a * x + b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = abs(a) > 0.05 }
new UI { type = slider; label = "коэффициент a"; variable = a; min = -3; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "константа b"; variable = b; min = -6; max = 6; step = 0.1; default = -2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a) > 0.05) {
    float x1 = -b / a;
    R1.pos.x = x1; R1.pos.y = 0;
    string dir = ""; if (a > 0) { dir = "x > " + num(x1, 2); } else { dir = "x < " + num(x1, 2); }
    info = "Уравнение: " + format(a, 1) + "x " + (b >= 0 ? "+ " : "− ") + format(abs(b), 1) + " = 0. Корень x = " + num(x1, 2) + ". Решение: **" + dir + "**.";
  } else {
    info = "Вырожденный случай: a ≈ 0.";
  }
}
]
