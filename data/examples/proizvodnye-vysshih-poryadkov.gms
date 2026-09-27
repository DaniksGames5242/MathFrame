[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = 1; float x0 = 1; string info = "";
func f(x) = a * x * x * x + b * x * x;
func fd(x) = 3 * a * x * x + 2 * b * x;
func fdd(x) = 6 * a * x + 2 * b;
draw Function { name = "gf"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 2 }
draw Function { name = "gd"; f = "fd"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 2 }
draw Function { name = "gdd"; f = "fdd"; xmin = -10; xmax = 10; color = #22c55e; thickness = 2 }
new UI { type = slider; label = "a"; variable = a; min = -2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -5; max = 5; step = 0.1; default = 1 }
new UI { type = slider; label = "точка x₀"; variable = x0; min = -5; max = 5; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a) < 0.05) { a = 0.1; }
  info = "f(x) = ax³ + bx² (синий), первая производная f'(x) = 3ax² + 2bx (оранжевый), вторая производная f''(x) = (f')'(x) = 6ax + 2b (зелёный).\n\nПри x₀ = " + num(x0, 1) + " f'(x₀) = " + num(fd(x0), 2) + ", f''(x₀) = " + num(fdd(x0), 2) + ".";
}
]
