[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = -2; float c = 1; string info = "";
float act1 = 0; float act2 = 0;
func f(x) = abs(a * x + b) - c;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = act1 > 0.5 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = act2 > 0.5 }
new UI { type = slider; label = "a"; variable = a; min = -3; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -6; max = 6; step = 0.1; default = -2 }
new UI { type = slider; label = "c"; variable = c; min = 0.5; max = 5; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a) < 0.05) { a = 0.1; }
  act1 = 0; act2 = 0;
  float x = -10; int cnt = 0; float prev = f(-10);
  float rx1 = 0; float rx2 = 0;
  while (x <= 10) { float curr = f(x); if (prev * curr < 0 && cnt < 2) { if (cnt == 0) { rx1 = x - 0.025; R1.pos.x = rx1; R1.pos.y = 0; act1 = 1; } if (cnt == 1) { rx2 = x - 0.025; R2.pos.x = rx2; R2.pos.y = 0; act2 = 1; } cnt = cnt + 1; } prev = curr; x = x + 0.05; }
  string cond = "|ax + b| = c";
  if (c <= 0) { info = "c ≤ 0 — уравнение " + cond + " не имеет решений."; }
  else { info = "Уравнение " + cond + ": корни x₁ = " + num(rx1, 2) + ", x₂ = " + num(rx2, 2) + "."; }
}
]
