[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = 1; string info = "";
func f(x) = log10(x);
draw Function { name = "gr"; f = "f"; xmin = 0.01; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "**y = lg(x)** десятичный логарифм: lg 10 = 1, область определения x > 0.";
}
]
