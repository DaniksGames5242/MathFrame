[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float p = 4; float alpha = 0.5; string info = "";
func f(x) = p / sin(alpha) - x / tan(alpha);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "p (расстояние)"; variable = p; min = 0.5; max = 6; step = 0.1; default = 4 }
new UI { type = slider; label = "α (радианы)"; variable = alpha; min = 0.1; max = 3; step = 0.1; default = 0.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "**x·cos(α) + y·sin(α) = p** при p = " + format(p, 1) + ", α ≈ " + format(alpha, 2) + " рад: расстояние от начала координат до прямой равно " + format(p, 1) + ", угол нормали к оси x равен " + format(alpha, 2) + " рад.";
}
]
