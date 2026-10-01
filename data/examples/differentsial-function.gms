[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float dx = 1.5; string info = "";
func f(x) = 0.2 * x * x;
func t(x) = 0.2 * a * a + 0.4 * a * (x - a);
draw Function { name = "gf"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gt"; f = "t"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 2 }
new UI { type = slider; label = "точка a"; variable = a; min = -3; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "приращение dx"; variable = dx; min = -2; max = 2; step = 0.1; default = 1.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float dy = 0.4 * a * dx;
  float delta = 0.2 * (a + dx) * (a + dx) - 0.2 * a * a;
  info = "**Дифференциал функции** y = 0,2x² в точке a = " + num(a, 1) + ": f′(x) = 0,4x, dy = f′(a)·dx = " + num(0.4 * a, 2) + " × " + num(dx, 1) + " = " + num(dy, 2) + ".\n\nТочное приращение Δy = f(a+dx) − f(a) = " + num(delta, 2) + " — при малом |dx| dy и Δy близки (оранжевая касательная приближает синий график).";
}
]
