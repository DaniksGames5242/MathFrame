[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = 1; string info = "";
func f(x) = log(max(0.001, x)) / log(a) - b;
draw Function { name = "gr"; f = "f"; xmin = 0.1; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = abs(a - 1) > 0.05 }
new UI { type = slider; label = "основание a"; variable = a; min = 0.5; max = 4; step = 0.1; default = 2 }
new UI { type = slider; label = "значение b"; variable = b; min = -2; max = 3; step = 0.2; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a - 1) > 0.05) {
    float x1 = pow(a, b);
    R1.pos.x = x1; R1.pos.y = 0;
    string dir = ""; if (a > 1) { dir = "x > " + num(x1, 2); } else { dir = "0 < x < " + num(x1, 2); }
    info = "Неравенство: logₐ(x) > " + format(b, 1) + ", где a = " + format(a, 1) + ". Корень x = " + num(x1, 2) + ". Решение: **" + dir + "**.";
  }
}
]
