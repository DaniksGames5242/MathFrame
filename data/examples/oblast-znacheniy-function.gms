[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float k = 1; string info = "";
func f(x) = a * sin(k * x);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "амплитуда a"; variable = a; min = 0.5; max = 5; step = 0.1; default = 1 }
new UI { type = slider; label = "период k"; variable = k; min = 0.5; max = 3; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "y = " + format(a, 1) + "sin(" + format(k, 1) + "x). Область значений: [" + num(-a, 1) + ", " + format(a, 1) + "].";
}
]
