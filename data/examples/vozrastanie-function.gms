[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = 0; string info = "";
func f(x) = a * x + b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "угловой коэффициент a"; variable = a; min = -3; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "сдвиг b"; variable = b; min = -6; max = 6; step = 0.1; default = 0 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Update {
  string trend = "возрастает"; if (a < 0) { trend = "убывает"; }
  info = "y = " + format(a, 1) + "x " + term(b, 1) + ". Функция " + trend + " (a = " + format(a, 1) + " " + (a > 0 ? "> 0" : "< 0") + ").";
}
]
