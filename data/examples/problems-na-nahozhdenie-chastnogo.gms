[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 15; float b = 3; string info = ""; float ratio = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "делимое"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "делитель"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "частное"; size = 0.9 }
new UI { type = slider; label = "делимое"; variable = a; min = 6; max = 20; step = 1; default = 15 }
new UI { type = slider; label = "делитель"; variable = b; min = 1; max = 5; step = 1; default = 3 }
Function bar(k, x_pos, v, c) { addNode(g, k + "0", [x_pos, -3]); addNode(g, k + "1", [x_pos, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 20;
Update {
  ratio = a / b;
  g = newGraph(); bar("a", -3, a, "#3b82f6"); bar("b", 0, b, "#f59e0b"); bar("c", 3, ratio, "#22c55e");
  info = "Задача на частное: " + format(a, 0) + " ÷ " + format(b, 0) + " = **" + format(ratio, 2) + "**.";
}
]
