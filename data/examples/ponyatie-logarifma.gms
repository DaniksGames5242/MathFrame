[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float b = 2; string info = "";
func f(x) = pow(b, x);
func g(x) = log(x) / log(b);
draw Function { name = "gExp"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #f59e0b; thickness = 3 }
draw Function { name = "gLog"; f = "g"; xmin = 0.001; xmax = 8; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "основание b"; variable = b; min = 0.2; max = 5; step = 0.1; default = 2 }
Update {
  if (abs(b - 1) < 0.05) { b = 1.1; }
  info = "**Логарифм** числа a по основанию b — это показатель x, для которого bˣ = a: x = logᵦ a.\n\nОранжевый график y = bˣ и синий y = logᵦ x при b = " + format(b, 1) + " симметричны относительно прямой y = x — это графики взаимно обратных функций.";
}
]
