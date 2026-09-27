[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a = 1; float b = -1; float c = -2; string info = "";
func f(x) = a * x * x + b * x + c;
draw Function { name = "gr"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = -3; max = 3; step = 0.5; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -6; max = 6; step = 0.5; default = -1 }
new UI { type = slider; label = "c"; variable = c; min = -6; max = 6; step = 0.5; default = -2 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function term(v, d) { if (v < 0) { return "− " + format(-v, d); } return "+ " + format(v, d); }
Update {
  if (abs(a) < 0.2) { a = 0.2; }
  info = "**Многочлен** y = " + format(a,1) + "x² " + term(b,1) + "x " + term(c,1) + " — сумма трёх одночленов: " + format(a,1) + "x² (степень 2), " + num(b,1) + "x (степень 1) и число " + num(c,1) + " (степень 0). Степень многочлена — наибольшая из степеней его членов, здесь равна 2.";
}
]
