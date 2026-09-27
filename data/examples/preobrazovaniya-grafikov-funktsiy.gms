[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float h = 2; float k = 1.5; string info = "";
func f(x) = x * x;
func g(x) = k * (x - h) * (x - h);
draw Function { name = "g0"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #f59e0b; thickness = 2 }
draw Function { name = "g1"; f = "g"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "h"; variable = h; min = -3; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "k"; variable = k; min = 0.5; max = 2; step = 0.1; default = 1.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  string s = "(x − " + format(h, 1) + ")²"; if (h < 0) { s = "(x + " + format(-h, 1) + ")²"; }
  info = "Оранжевый — y = x², синий — y = " + format(k, 1) + s + ". Сдвиг на h, растяжение в k раз.";
}
]
