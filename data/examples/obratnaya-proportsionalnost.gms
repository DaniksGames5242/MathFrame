[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k = 4; string info = "";
func f(x) = k / x;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "k"; variable = k; min = 1; max = 8; step = 0.2; default = 4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "y = " + format(k, 1) + "/x: обратная пропорциональность (гипербола) с ветвями в I и III четвертях.";
}
]
