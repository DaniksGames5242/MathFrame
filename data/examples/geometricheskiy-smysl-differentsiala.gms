[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float dx = 1.5; string info = "";
func f(x) = 0.2 * x * x;
func t(x) = 0.2 * a * a + 0.4 * a * (x - a);
draw Function { name = "gf"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gt"; f = "t"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 2 }
new Point { name = "B"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "C"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new Line { name = "seg"; pos = (B, C); color = #22c55e }
new UI { type = slider; label = "точка a"; variable = a; min = -3; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "приращение dx"; variable = dx; min = 0.3; max = 2; step = 0.1; default = 1.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  B.pos.x = a + dx; B.pos.y = t(a + dx);
  C.pos.x = a + dx; C.pos.y = f(a + dx);
  info = "**Геометрический смысл дифференциала**: dy = f′(a)·dx — приращение ординаты касательной (оранжевая точка B), а Δy = f(a+dx) − f(a) — приращение самой функции (зелёная точка C). Зелёный отрезок BC — погрешность линейного приближения, она тем меньше, чем меньше dx = " + num(dx, 1) + ".";
}
]
