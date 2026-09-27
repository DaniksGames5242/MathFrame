[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float w = 1; float b = 0.5; string info = "";
float act1 = 0; float act2 = 0; float act3 = 0; float act4 = 0;
func f(x) = a * sin(w * x) - b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = act1 > 0.5 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = act2 > 0.5 }
new Point { name = "R3"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = act3 > 0.5 }
new Point { name = "R4"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = act4 > 0.5 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "w (частота)"; variable = w; min = 0.5; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -1; max = 1; step = 0.1; default = 0.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(b) > abs(a)) { b = a * 0.5; }
  act1 = 0; act2 = 0; act3 = 0; act4 = 0;
  float x = -10; int cnt = 0; float prev = f(-10);
  float rx1 = 0; float rx2 = 0; float rx3 = 0; float rx4 = 0;
  while (x <= 10) { float curr = f(x); if (prev * curr < 0 && cnt < 4) { if (cnt == 0) { rx1 = x - 0.025; R1.pos.x = rx1; R1.pos.y = 0; act1 = 1; } if (cnt == 1) { rx2 = x - 0.025; R2.pos.x = rx2; R2.pos.y = 0; act2 = 1; } if (cnt == 2) { rx3 = x - 0.025; R3.pos.x = rx3; R3.pos.y = 0; act3 = 1; } if (cnt == 3) { rx4 = x - 0.025; R4.pos.x = rx4; R4.pos.y = 0; act4 = 1; } cnt = cnt + 1; } prev = curr; x = x + 0.05; }
  string roots = "нет корней (b/a > 1)";
  if (act1 > 0.5) { roots = num(rx1, 2); }
  if (act2 > 0.5) { roots = roots + ", " + num(rx2, 2); }
  if (act3 > 0.5) { roots = roots + ", " + num(rx3, 2); }
  if (act4 > 0.5) { roots = roots + ", " + num(rx4, 2); }
  info = "Простейшее тригонометрическое уравнение sin(wx) = b/a. Корни на [−10; 10]: x = " + roots + ".";
}
]
