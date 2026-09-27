[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float p = -2; float q = -3; float D = 0; string info = "";
func f(x) = x * x + p * x + q;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = D >= 0 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = D > 0 }
new UI { type = slider; label = "p"; variable = p; min = -6; max = 6; step = 0.1; default = -2 }
new UI { type = slider; label = "q"; variable = q; min = -6; max = 6; step = 0.1; default = -3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  D = p * p - 4 * q;
  if (D >= 0) { float x1 = (-p - sqrt(D)) / 2; float x2 = (-p + sqrt(D)) / 2; if (abs(R1.pos.x - x1) > 0.0001) { R1.pos.x = x1; R1.pos.y = 0; R2.pos.x = x2; R2.pos.y = 0; } info = "D = " + num(D, 2) + ", x₁ = " + num(x1, 2) + ", x₂ = " + num(x2, 2) + "."; }
  if (D < 0) { info = "D = " + num(D, 2) + " < 0 — корней нет."; }
}
]
