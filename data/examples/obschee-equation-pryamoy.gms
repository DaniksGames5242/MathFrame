[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float A = 1; float B = 1; float C = -2; string info = "";
func f(x) = (-A * x - C) / B;
draw Function { name = "gr"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "A"; variable = A; min = -4; max = 4; step = 0.5; default = 1 }
new UI { type = slider; label = "B"; variable = B; min = 0.5; max = 4; step = 0.5; default = 1 }
new UI { type = slider; label = "C"; variable = C; min = -6; max = 6; step = 0.5; default = -2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return "+ " + format(x, d); }
Update {
  info = "**Общее уравнение прямой:** Ax + By + C = 0 при A = " + format(A, 1) + ", B = " + format(B, 1) + ", C " + num(C, 1) + ".\n\nНормальный вектор прямой — (A; B) = (" + format(A, 1) + "; " + format(B, 1) + "), он перпендикулярен графику.";
}
]
