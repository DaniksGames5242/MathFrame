[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = 1; string info = "";
func f(x) = a * tan(b * x);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = 0.5; max = 2; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "**y = a·tan(bx)** при a = " + format(a, 1) + ", b = " + format(b, 1) + ": период π/b ≈ " + format(3.1416 / b, 2) + ". Тангенс имеет вертикальные асимптоты.";
}
]
