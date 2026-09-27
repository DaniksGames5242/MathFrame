[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float b = 7; float q = 8; string info = ""; float a = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "Делитель"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "Частное"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "Делимое"; size = 0.9 }
new UI { type = slider; label = "делитель b"; variable = b; min = 2; max = 12; step = 1; default = 7 }
new UI { type = slider; label = "частное q"; variable = q; min = 1; max = 20; step = 1; default = 8 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 250;
Update {
  a = b * q;
  g = newGraph(); bar("a", -3, b * 15, "#3b82f6"); bar("b", 0, q, "#f59e0b"); bar("c", 3, a / 1, "#22c55e");
  info = "a : b = q ⟺ a = b × q. При b = " + format(b, 0) + " и q = " + format(q, 0) + " получим a = " + format(b, 0) + " × " + format(q, 0) + " = **" + format(a, 0) + "**.";
}
]
