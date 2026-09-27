[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = 0; float c = -4; float D = 0; string info = "";
func f(x) = a * x * x + b * x + c;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = true }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = D > 0 }
new UI { type = slider; label = "a"; variable = a; min = 0.2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = 0; max = 0; step = 1; default = 0 }
new UI { type = slider; label = "c"; variable = c; min = -6; max = 0; step = 0.1; default = -4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a) < 0.05) { a = 0.2; }
  D = -4 * a * c;
  if (D >= 0) { float x1 = -sqrt(-c / a); float x2 = sqrt(-c / a); R1.pos.x = x1; R1.pos.y = 0; if (x2 != x1) { R2.pos.x = x2; R2.pos.y = 0; } info = "Вид ax² + c = 0: корни x = ±√(" + num(-c/a, 2) + ") = " + num(x2, 2) + ", " + num(x1, 2) + "."; }
  else { info = "c > 0 — корней нет."; }
}
]
