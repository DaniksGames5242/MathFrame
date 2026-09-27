[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float b = 1; float c = 4; float x0 = 0; float y0 = 0; string info = "";
func f(x) = x + b;
func g(x) = c - 2 * x;
draw Function { name = "g1"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "g2"; f = "g"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new UI { type = slider; label = "b"; variable = b; min = -4; max = 4; step = 0.1; default = 1 }
new UI { type = slider; label = "c"; variable = c; min = -6; max = 6; step = 0.1; default = 4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Update {
  x0 = (c - b) / 3; y0 = x0 + b;
  R1.pos.x = x0; R1.pos.y = y0;
  info = "**Метод подстановки** для системы y = x " + term(b, 1) + " и 2x + y = " + num(c, 1) + ": первое уравнение уже задаёт y через x (синий график) — подставляем во второе: 2x + (x " + term(b, 1) + ") = " + num(c, 1) + ", отсюда x = " + num(x0, 2) + ", y = " + num(y0, 2) + " (точка пересечения графиков).";
}
]
