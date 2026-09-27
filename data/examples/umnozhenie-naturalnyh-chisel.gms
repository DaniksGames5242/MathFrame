[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 5; float b = 30; string info = ""; float p = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "число a"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "число b"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "произвед."; size = 0.9 }
new UI { type = slider; label = "число a"; variable = a; min = 1; max = 20; step = 1; default = 5 }
new UI { type = slider; label = "число b"; variable = b; min = 1; max = 60; step = 1; default = 30 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 1200;
Update {
  p = a * b;
  g = newGraph(); bar("a", -3, a * 100, "#3b82f6"); bar("b", 0, b * 20, "#f59e0b"); bar("c", 3, p, "#22c55e");
  info = format(a, 0) + " × " + format(b, 0) + " — это сумма " + format(b, 0) + " слагаемых по " + format(a, 0) + " = **" + format(p, 0) + "**.";
}
]
