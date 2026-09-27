[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = -2; string info = "";
func f(x) = a * (x - b) * (x - b) - 3;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "m"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = true }
new UI { type = slider; label = "b"; variable = b; min = -5; max = 3; step = 0.1; default = -2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a) < 0.05) { a = 0.1; }
  float minval = -3;
  m.pos.x = b; m.pos.y = minval;
  info = "Функция y = (x − " + format(b, 1) + ")² − 3 имеет наименьшее значение −3 при x = " + format(b, 1) + ".";
}
]
