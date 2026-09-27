[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float A = 3; float k = 2; string info = ""; float g = 0;
Function bar(name, x, v, c) { addNode(g, name + "0", [x, -3]); addNode(g, name + "1", [x, -3 + v]); addEdge(g, name + "0", name + "1", 1, c); }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "общий множитель A"; variable = A; min = 1; max = 5; step = 1; default = 3 }
new UI { type = slider; label = "k"; variable = k; min = -4; max = 4; step = 1; default = 2 }
Update {
  if (k == 0) { k = 1; }
  g = newGraph(); bar("a", -3, A * (k + 4) / 5, "#3b82f6"); bar("b", 0, A / 5, "#f59e0b"); bar("c", 3, A * k / 5, "#22c55e");
  info = "**Ax² " + (k >= 0 ? "+ " : "− ") + format(abs(A * k), 0) + "x = Ax(x " + (k >= 0 ? "+ " : "− ") + format(abs(k), 0) + ")**, где A = " + format(A, 0) + ", k = " + format(k, 0) + ".\n\nОбщий множитель Ax есть в каждом члене: " + format(A, 0) + "x² и " + format(A, 0) + "·" + format(k, 0) + "x — оба делятся на Ax, поэтому его можно вынести за скобки.";
}
]
