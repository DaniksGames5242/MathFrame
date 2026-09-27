[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float p = 5; float q = 1; float x0 = 0; float y0 = 0; string info = "";
func f(x) = p - x;
func g(x) = x - q;
draw Function { name = "g1"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "g2"; f = "g"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new UI { type = slider; label = "p"; variable = p; min = -6; max = 6; step = 0.1; default = 5 }
new UI { type = slider; label = "q"; variable = q; min = -6; max = 6; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Update {
  x0 = (p + q) / 2; y0 = p - x0;
  R1.pos.x = x0; R1.pos.y = y0;
  info = "**Метод сложения** для системы x + y = " + num(p, 1) + " и x − y = " + num(q, 1) + ": сложив уравнения, y исключается: 2x = " + num(p, 1) + " " + term(q, 1) + ", x = " + num(x0, 2) + "; вычтя их, x исключается: 2y = " + num(p, 1) + " " + term(-q, 1) + ", y = " + num(y0, 2) + " (точка пересечения графиков).";
}
]
