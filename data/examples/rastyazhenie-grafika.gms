[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k = 1.8; string info = "";
func f(x) = x * x;
func g(x) = k * x * x;
draw Function { name = "g0"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #f59e0b; thickness = 2 }
draw Function { name = "g1"; f = "g"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "k"; variable = k; min = 0.5; max = 3; step = 0.1; default = 1.8 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "Оранжевый — y = x², синий — y = " + format(k, 1) + "x². При k > 1 график растягивается вверх в " + format(k, 1) + " раз.";
}
]
