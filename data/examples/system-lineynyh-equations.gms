[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float k1 = 1; float b1 = 1; float k2 = -1; float b2 = 4; string info = "";
func f1(x) = k1 * x + b1;
func f2(x) = k2 * x + b2;
draw Function { name = "g1"; f = "f1"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "g2"; f = "f2"; xmin = -8; xmax = 8; color = #f59e0b; thickness = 3 }
new UI { type = slider; label = "k₂"; variable = k2; min = -3; max = 3; step = 0.1; default = -1 }
new UI { type = slider; label = "b₂"; variable = b2; min = -6; max = 6; step = 0.1; default = 4 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  if (abs(k1 - k2) < 0.05) { k2 = k2 + 0.1; }
  float xr = (b2 - b1) / (k1 - k2); float yr = k1 * xr + b1;
  info = "**Система линейных уравнений** y = x + 1 и y = " + num(k2, 1) + "x + " + num(b2, 1) + ": решение — точка пересечения графиков.\n\nРешение системы: x = " + num(xr, 2) + ", y = " + num(yr, 2) + " — единственная пара, удовлетворяющая обоим уравнениям одновременно.";
}
]
