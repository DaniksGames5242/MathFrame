[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a1 = 2; float b1 = -3; float a2 = -1; float b2 = 4; string info = "";
func f(x) = a1 * x * x + b1 * x;
func h(x) = a2 * x * x + b2 * x;
func s(x) = f(x) - h(x);
draw Function { name = "gf"; f = "f"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 2 }
draw Function { name = "gh"; f = "h"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 2 }
draw Function { name = "gs"; f = "s"; xmin = -10; xmax = 10; grid = true; color = #22c55e; thickness = 3 }
new UI { type = slider; label = "a1"; variable = a1; min = -3; max = 3; step = 0.5; default = 2 }
new UI { type = slider; label = "b1"; variable = b1; min = -6; max = 6; step = 0.5; default = -3 }
new UI { type = slider; label = "a2"; variable = a2; min = -3; max = 3; step = 0.5; default = -1 }
new UI { type = slider; label = "b2"; variable = b2; min = -6; max = 6; step = 0.5; default = 4 }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Update {
  info = "Синий P(x) = " + format(a1, 1) + "x² " + term(b1, 1) + "x, оранжевый Q(x) = " + format(a2, 1) + "x² " + term(b2, 1) + "x.\n\nЗелёный — разность P(x) − Q(x) = " + format(a1 - a2, 1) + "x² " + term(b1 - b2, 1) + "x: коэффициенты второго многочлена берутся с противоположным знаком.";
}
]
