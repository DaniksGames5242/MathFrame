[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = 2; string info = "";
func f(x) = pow(a, x) - b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = a > 0.1 && abs(a - 1) > 0.05 }
new UI { type = slider; label = "основание a"; variable = a; min = 0.5; max = 4; step = 0.1; default = 2 }
new UI { type = slider; label = "значение b"; variable = b; min = 0.5; max = 8; step = 0.2; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (a > 0.1 && abs(a - 1) > 0.05) {
    float x1 = log(b) / log(a);
    R1.pos.x = x1; R1.pos.y = 0;
    string dir = ""; if (a > 1) { dir = "x > " + num(x1, 2); } else { dir = "x < " + num(x1, 2); }
    info = "Неравенство: " + format(a, 1) + "ˣ > " + format(b, 1) + ". Корень x = " + num(x1, 2) + ". Решение: **" + dir + "**.";
  }
}
]
