[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float phase = 0; string info = "";
func f(x) = sin(x + phase);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "фаза"; variable = phase; min = -3.14; max = 3.14; step = 0.1; default = 0 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "Функция y = sin(x + " + format(phase, 2) + ") определена для всех действительных значений x. Синус и косинус можно вычислить в любой точке числовой оси.";
}
]
