[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float P = 25; float t = 8; string info = ""; float A = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "работа A"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "P × t"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "время t"; size = 0.9 }
new UI { type = slider; label = "производительность P"; variable = P; min = 5; max = 100; step = 5; default = 25 }
new UI { type = slider; label = "время t, ч"; variable = t; min = 1; max = 10; step = 0.5; default = 8 }
Function bar(k, x, val, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * val / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 1000;
Update {
  A = P * t;
  g = newGraph(); bar("a", -3, A, "#3b82f6"); bar("b", 0, A, "#f59e0b"); bar("c", 3, t, "#22c55e");
  info = "A = P × t = " + format(P, 0) + " × " + format(t, 1) + " = **" + format(A, 1) + "** единиц.";
}
]
