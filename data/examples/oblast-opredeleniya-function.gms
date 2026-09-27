[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = 0; string info = "";
func f(x) = a * sqrt(max(0, x - b));
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "сдвиг b"; variable = b; min = -5; max = 5; step = 0.1; default = 0 }
new UI { type = slider; label = "масштаб a"; variable = a; min = 0.5; max = 5; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "y = " + format(a, 1) + "√(x − " + format(b, 1) + "). Область определения: x ≥ " + format(b, 1) + ".";
  if (b == 0) { info = "y = " + format(a, 1) + "√x. Область определения: x ≥ 0."; }
}
]
