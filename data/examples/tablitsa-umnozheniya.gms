[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 4; float b = 6; string info = "";
draw Graph { name = "gr"; graph = "g"; nodeRadius = 5; edgeWidth = 0; labels = false; interactive = false; nodeColor = #3b82f6 }
new UI { type = slider; label = "a"; variable = a; min = 1; max = 9; step = 1; default = 4 }
new UI { type = slider; label = "b"; variable = b; min = 1; max = 9; step = 1; default = 6 }
Update {
  float na = round(a); float nb = round(b);
  g = newGraph();
  repeat (round(na * nb)) { float ii = floor(i / nb); float jj = i - ii * nb; addNode(g, "n" + format(i, 0), [-4 + jj * 0.9, 3 - ii * 0.9]); }
  info = "**" + format(na, 0) + " × " + format(nb, 0) + " = " + format(na * nb, 0) + "**: произведение — число точек в прямоугольнике из " + format(na, 0) + " строк и " + format(nb, 0) + " столбцов, как в таблице умножения.";
}
]
