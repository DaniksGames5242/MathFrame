[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; string info = "";
func f(x) = a * sin(x) / (1 + x * x * 0.1);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 3; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float maxval = a;
  info = "Функция y = " + format(a, 1) + "·sin(x)/(1 + 0,1x²) ограничена: −" + format(maxval, 1) + " ≤ y ≤ " + format(maxval, 1) + " для всех x.";
}
]
