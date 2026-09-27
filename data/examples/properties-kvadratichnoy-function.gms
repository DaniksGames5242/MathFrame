[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = -2; float c = -3; string info = "";
func f(x) = a * x * x + b * x + c;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = -3; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -6; max = 6; step = 0.1; default = -2 }
new UI { type = slider; label = "c"; variable = c; min = -6; max = 6; step = 0.1; default = -3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a) < 0.05) { a = 0.1; }
  float xv = -b / (2 * a);
  float yv = a * xv * xv + b * xv + c;
  string direction = "ветвями вверх";
  if (a < 0) { direction = "ветвями вниз"; }
  string term_b = (b < 0 ? "− " : "+ ") + format(abs(b), 1);
  string term_c = (c < 0 ? "− " : "+ ") + format(abs(c), 1);
  info = "Парабола y = " + format(a, 1) + "x² " + term_b + "x " + term_c + " имеет вершину (" + num(xv, 1) + ", " + num(yv, 1) + "), " + direction + ".";
}
]
