[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float h = 3; float v = 2; string info = "";
func f(x) = x * x - 2;
func g(x) = (x - h) * (x - h) - 2 + v;
draw Function { name = "g0"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #f59e0b; thickness = 2 }
draw Function { name = "g1"; f = "g"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "h"; variable = h; min = -4; max = 4; step = 0.1; default = 3 }
new UI { type = slider; label = "v"; variable = v; min = -3; max = 3; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  string s = "(x − " + format(h, 1) + ")² − 2"; if (h < 0) { s = "(x + " + format(-h, 1) + ")² − 2"; }
  string v_sign = " + "; if (v < 0) { v_sign = " − "; }
  if (v < 0) { info = "Оранжевый — исход y = x² − 2, синий — y = " + s + v_sign + format(-v, 1) + ". Сдвиг на (" + format(h, 1) + ", " + format(v, 1) + ")."; }
  else { info = "Оранжевый — исход y = x² − 2, синий — y = " + s + v_sign + format(v, 1) + ". Сдвиг на (" + format(h, 1) + ", " + format(v, 1) + ")."; }
}
]
