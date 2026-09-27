[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 60; float b = 5; string info = ""; float q = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "Делимое"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "Делитель"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "Частное"; size = 0.9 }
new UI { type = slider; label = "делимое a"; variable = a; min = 10; max = 100; step = 5; default = 60 }
new UI { type = slider; label = "делитель b"; variable = b; min = 1; max = 10; step = 1; default = 5 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 100;
Update {
  if (abs(b - 1) < 0.05) { b = 1.1; }
  q = a / b;
  g = newGraph(); bar("a", -3, a, "#3b82f6"); bar("b", 0, b * 10, "#f59e0b"); bar("c", 3, q, "#22c55e");
  info = format(a, 0) + " : " + format(b, 0) + " = " + format(q, 1) + ", так как " + format(b, 0) + " × " + format(q, 1) + " = **" + format(a, 0) + "**.";
}
]
