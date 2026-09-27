[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float c = 2; string info = "";
func f(x) = 1 / (x - c);
draw Function { name = "gr"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "точка c"; variable = c; min = -6; max = 6; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "**Разрыв второго рода**: у f(x) = 1/(x − " + num(c, 1) + ") в точке x = " + num(c, 1) + " хотя бы один из односторонних пределов бесконечен (слева −∞, справа +∞) — в отличие от разрыва первого рода, где оба предела конечны.";
}
]
