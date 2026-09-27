[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = 1; string info = "";
func f(x) = a * sin(b * x);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a (амплитуда)"; variable = a; min = 0.5; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "b (частота)"; variable = b; min = 0.5; max = 3; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "Область значений функции y = " + format(a, 1) + "·sin(" + format(b, 1) + "x): все y в отрезке [" + num(-a, 1) + ", " + format(a, 1) + "]. Синус ограничен амплитудой " + format(a, 1) + ".";
}
]
