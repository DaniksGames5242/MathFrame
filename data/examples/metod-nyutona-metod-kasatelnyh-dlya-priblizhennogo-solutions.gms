[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float x0 = 2.3; string info = "";
func f(x) = x * x - 2;
func tg(x) = f(x0) + 2 * x0 * (x - x0);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gt"; f = "tg"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 2 }
new Point { name = "P0"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "P1"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new UI { type = slider; label = "x₀"; variable = x0; min = -5; max = 5; step = 0.05; default = 2.3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(x0) < 0.1) { x0 = 0.1; }
  P0.pos.x = x0; P0.pos.y = f(x0);
  float x1 = x0 - f(x0) / (2 * x0);
  P1.pos.x = x1; P1.pos.y = 0;
  info = "**Метод Ньютона**: для f(x) = x² − 2 (корень √2 ≈ 1.41) касательная в точке x₀ = " + num(x0, 2) + " (оранжевая) пересекает ось Ox в x₁ = x₀ − f(x₀)/f′(x₀) = " + num(x1, 3) + " — следующее приближение (зелёная точка), ближе к корню.";
}
]
