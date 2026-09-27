[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float s = 2; float D = 0; string info = "";
func f(x) = x * x;
func g(x) = s - x;
draw Function { name = "g1"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "g2"; f = "g"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; active = D >= 0 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; active = D > 0.0001 }
new UI { type = slider; label = "s"; variable = s; min = -6; max = 6; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Update {
  D = 1 + 4 * s;
  if (D > 0.0001) { float x1 = (-1 - sqrt(D)) / 2; float x2 = (-1 + sqrt(D)) / 2; R1.pos.x = x1; R1.pos.y = x1 * x1; R2.pos.x = x2; R2.pos.y = x2 * x2; info = "**Метод подстановки** для системы y = x² и x + y = " + num(s, 1) + ": из второго уравнения y = " + num(s, 1) + " − x, подставляем в первое: x² = " + num(s, 1) + " − x, x² + x " + term(-s, 1) + " = 0, D = " + num(D, 2) + " — корни x₁ = " + num(x1, 2) + ", x₂ = " + num(x2, 2) + "."; }
  if (abs(D) <= 0.0001) { float x1 = -0.5; R1.pos.x = x1; R1.pos.y = x1 * x1; info = "D = 0 — система имеет ровно одно решение x = " + num(x1, 2) + "."; }
  if (D < -0.0001) { info = "D = " + num(D, 2) + " < 0 — система решений не имеет."; }
}
]
