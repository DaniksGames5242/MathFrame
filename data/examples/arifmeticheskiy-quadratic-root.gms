[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = 1; string info = "";
func f(x) = sqrt(x);
draw Function { name = "gr"; f = "f"; xmin = 0.001; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "**y = √x** арифметический квадратный корень: √4 = 2, область определения x ≥ 0.";
}
]
