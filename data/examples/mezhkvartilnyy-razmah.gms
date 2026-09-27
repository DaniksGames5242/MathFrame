[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float x1 = 2; float x2 = 4; float x3 = 7; float x4 = 9; float x5 = 12; string info = "";
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -4.3]); addNode(g, k + "1", [x, -4.3 + 0.6 * v]); addEdge(g, k + "0", k + "1", 1, c); }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; labels = false; interactive = false }
new UI { type = slider; label = "значение x₂"; variable = x2; min = 2; max = 7; step = 0.5; default = 4 }
Update {
  float q1 = (x1 + x2) / 2; float q3 = (x4 + x5) / 2; float iqr = q3 - q1;
  g = newGraph();
  bar("a", -6, x1, "#3b82f6"); bar("b", -3.6, x2, "#f59e0b"); bar("c", -1.2, x3, "#3b82f6"); bar("d", 1.2, x4, "#3b82f6"); bar("e", 3.6, x5, "#3b82f6");
  info = "**Отсортированная выборка:** " + format(x1, 1) + "; " + format(x2, 1) + "; " + format(x3, 1) + "; " + format(x4, 1) + "; " + format(x5, 1) + ".\n\nНижний квартиль Q₁ = " + format(q1, 2) + " (середина младшей половины), верхний квартиль Q₃ = " + format(q3, 2) + " (середина старшей половины).\n\n**Межквартильный размах** IQR = Q₃ − Q₁ = " + format(iqr, 2) + " — размах средней половины выборки, не зависящий от крайних значений x₁ и x₅.";
}
]
