[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1.5; float b = 2; string info = "";
func f(x) = a * pow(x, b);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 3; step = 0.1; default = 1.5 }
new UI { type = slider; label = "b"; variable = b; min = -3; max = 3; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "**y = a·xᵇ** степенная функция с коэффициентом a =" + format(a, 1) + " и показателем b = " + format(b, 1) + ".";
}
]
