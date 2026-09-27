[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = -1; float c = -2; float D = 0; string info = "";
func f(x) = a * x * x + b * x + c;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = D >= 0 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = D > 0 }
new UI { type = slider; label = "a"; variable = a; min = -3; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -6; max = 6; step = 0.1; default = -1 }
new UI { type = slider; label = "c"; variable = c; min = -6; max = 6; step = 0.1; default = -2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return " − " + format(-x, d); } return " + " + format(x, d); }
Update {
  if (abs(a) < 0.05) { a = 0.1; }
  D = b * b - 4 * a * c;
  if (D >= 0) { float x1 = (-b - sqrt(D)) / (2 * a); float x2 = (-b + sqrt(D)) / (2 * a); if (abs(R1.pos.x - x1) > 0.0001) { R1.pos.x = x1; R1.pos.y = 0; R2.pos.x = x2; R2.pos.y = 0; } string fact = ""; if (abs(D) < 0.01) { fact = " = " + format(a, 1) + "(x" + term(-x1, 2) + ")²"; } else { fact = " = " + format(a, 1) + "(x" + term(-x1, 2) + ")(x" + term(-x2, 2) + ")"; } info = "x₁ = " + num(x1, 2) + ", x₂ = " + num(x2, 2) + "; разложение:" + fact + "."; }
  if (D < 0) { info = "D = " + num(D, 2) + " < 0 — действительных корней нет, разложение невозможно."; }
}
]
