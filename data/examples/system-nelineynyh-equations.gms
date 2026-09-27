[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k = 1; float b = 1; float D = 0; string info = "";
func f(x) = x * x;
func g(x) = k * x + b;
draw Function { name = "g1"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "g2"; f = "g"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; active = D >= 0 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; active = D > 0.0001 }
new UI { type = slider; label = "k"; variable = k; min = -4; max = 4; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -6; max = 6; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Update {
  D = k * k + 4 * b;
  if (D > 0.0001) { float x1 = (k - sqrt(D)) / 2; float x2 = (k + sqrt(D)) / 2; R1.pos.x = x1; R1.pos.y = x1 * x1; R2.pos.x = x2; R2.pos.y = x2 * x2; info = "**Нелинейная система** y = x² и y = " + num(k, 1) + "x " + term(b, 1) + ": приравняв правые части, x² " + term(-k, 1) + "x " + term(-b, 1) + " = 0, D = " + num(D, 2) + " > 0 — **два решения**: x₁ = " + num(x1, 2) + ", x₂ = " + num(x2, 2) + "."; }
  if (abs(D) <= 0.0001) { float x1 = k / 2; R1.pos.x = x1; R1.pos.y = x1 * x1; info = "D = 0 — прямая касается параболы в единственной точке x = " + num(x1, 2) + "."; }
  if (D < -0.0001) { info = "D = " + num(D, 2) + " < 0 — прямая и парабола **не пересекаются**, решений нет."; }
}
]
