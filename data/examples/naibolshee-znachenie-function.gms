[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = -1; float b = 2; string info = "";
func f(x) = a * (x - b) * (x - b) + 4;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = true }
new UI { type = slider; label = "b"; variable = b; min = -3; max = 5; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a) < 0.05) { a = -0.1; }
  float maxval = 4;
  M.pos.x = b; M.pos.y = maxval;
  info = "Функция y = −(x − " + format(b, 1) + ")² + 4 имеет наибольшее значение " + format(maxval, 1) + " при x = " + format(b, 1) + ".";
}
]
