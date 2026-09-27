[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float k = 1; float b = 2; string info = "";
func f(x) = k * log(x) / log(a) - b;
draw Function { name = "gr"; f = "f"; xmin = 0.001; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = true }
new UI { type = slider; label = "a (основание)"; variable = a; min = 1.1; max = 5; step = 0.1; default = 2 }
new UI { type = slider; label = "k"; variable = k; min = 0.5; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "b (число)"; variable = b; min = 1; max = 10; step = 0.5; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a - 1) < 0.05) { a = 1.1; }
  float x = 0.01; float prev = f(0.01);
  while (x <= 10) { float curr = f(x); if (prev * curr < 0) { R1.pos.x = x - 0.025; R1.pos.y = 0; } prev = curr; x = x + 0.05; }
  info = "Логарифмическое уравнение: k · logₐ x = " + format(b, 1) + " (a = " + format(a, 2) + "). Корень x = a в степени (b/k) = " + num(pow(a, b / k), 2) + ".";
}
]
