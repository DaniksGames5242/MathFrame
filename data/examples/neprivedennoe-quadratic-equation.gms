[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = -2; float c = -4; string info = "";
func f(x) = a * x * x + b * x + c;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = -4; max = 4; step = 0.1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = -6; max = 6; step = 0.1; default = -2 }
new UI { type = slider; label = "c"; variable = c; min = -6; max = 6; step = 0.1; default = -4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Update {
  if (abs(a) < 0.1) { a = 0.1; }
  string an = "неприведённое"; if (abs(a - 1) < 0.02) { an = "приведённое (a = 1)"; }
  info = "**Неприведённое квадратное уравнение** " + format(a, 1) + "x² " + term(b, 1) + "x " + term(c, 1) + " = 0 — коэффициент при x² равен a = " + format(a, 1) + " ≠ 1, уравнение " + an + ".\n\nДля решения его делят на a и приводят к виду x² " + term(b / a, 2) + "x " + term(c / a, 2) + " = 0.";
}
]
