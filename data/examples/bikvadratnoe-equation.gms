[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = -5; float c = 4; float D = 0; float t1 = 0; float t2 = 0; string info = "";
float act1 = 0; float act2 = 0; float act3 = 0; float act4 = 0;
func f(x) = a * x * x * x * x + b * x * x + c;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = act1 > 0.5 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = act2 > 0.5 }
new Point { name = "R3"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = act3 > 0.5 }
new Point { name = "R4"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = act4 > 0.5 }
new UI { type = slider; label = "a"; variable = a; min = -3; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -10; max = 10; step = 0.5; default = -5 }
new UI { type = slider; label = "c"; variable = c; min = -10; max = 10; step = 0.5; default = 4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a) < 0.05) { a = 0.1; }
  D = b * b - 4 * a * c;
  act1 = 0; act2 = 0; act3 = 0; act4 = 0;
  string roots = "нет";
  if (D >= 0) { t1 = (-b - sqrt(D)) / (2 * a); t2 = (-b + sqrt(D)) / (2 * a); if (t1 > 0) { float x1 = sqrt(t1); R1.pos.x = x1; R1.pos.y = 0; act1 = 1; R2.pos.x = -x1; R2.pos.y = 0; act2 = 1; roots = "±" + num(x1, 2); } if (t2 > 0) { float x3 = sqrt(t2); R3.pos.x = x3; R3.pos.y = 0; act3 = 1; R4.pos.x = -x3; R4.pos.y = 0; act4 = 1; if (act1 > 0.5) { roots = roots + ", ±" + num(x3, 2); } else { roots = "±" + num(x3, 2); } } info = "Решение биквадратного уравнения через подстановку y = x². Корни: x = " + roots + "."; }
  if (D < 0) { info = "D < 0 — действительных корней нет."; }
}
]
