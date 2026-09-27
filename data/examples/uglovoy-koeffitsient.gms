[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k = 1; float b = 1; string info = "";
func f(x) = k * x + b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "k"; variable = k; min = -3; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -5; max = 5; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Update {
  string trend = "возрастает";
  if (k < -0.05) { trend = "убывает"; } else if (k > -0.05 && k < 0.05) { trend = "горизонтальна"; }
  info = "Прямая y = " + format(k, 1) + "x " + term(b, 1) + " имеет угловой коэффициент " + format(k, 1) + ", поэтому функция " + trend + ".";
}
]
