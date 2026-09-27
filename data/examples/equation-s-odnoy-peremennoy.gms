[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = -4; string info = "";
func f(x) = a * x + b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "a"; variable = a; min = -5; max = 5; step = 0.1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = -8; max = 8; step = 0.1; default = -4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a) < 0.05) { a = 0.1; }
  float x = -b / a; R1.pos.x = x; R1.pos.y = 0;
  info = "**Уравнение с одной переменной** ax + b = 0 при a = " + format(a, 1) + ", b = " + format(b, 1) + " имеет единственный корень x = " + num(x, 2) + " — точку пересечения графика y = ax + b с осью Ox.";
}
]
