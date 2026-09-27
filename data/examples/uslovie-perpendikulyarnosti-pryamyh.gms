[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k1 = 2; string info = "";
func f(x) = k1 * x;
func g(x) = -x / k1;
draw Function { name = "g0"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #f59e0b; thickness = 2 }
draw Function { name = "g1"; f = "g"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "k₁ (угловой коэффициент)"; variable = k1; min = 0.1; max = 3; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float k2 = -1 / k1;
  info = "Оранжевая — **y = " + format(k1, 1) + "x**, синяя — **y = " + format(k2, 2) + "x**. Угловые коэффициенты k₁ = " + format(k1, 1) + " и k₂ = " + format(k2, 2) + " дают произведение k₁·k₂ = " + format(k1 * k2, 2) + " = −1, поэтому прямые перпендикулярны.";
}
]
