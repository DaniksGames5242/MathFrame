[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float B = 60; float p = 30; string info = ""; float X = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "X (ищем)"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "p% = B"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "100% − p%"; size = 0.9 }
new UI { type = slider; label = "часть B"; variable = B; min = 10; max = 300; step = 10; default = 60 }
new UI { type = slider; label = "процент p"; variable = p; min = 1; max = 100; step = 1; default = 30 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 300;
Update {
  X = B * 100 / p;
  g = newGraph(); bar("a", -3, X, "#3b82f6"); bar("b", 0, B, "#f59e0b"); bar("c", 3, X - B, "#22c55e");
  info = "Если " + format(p, 0) + "% от X = " + format(B, 0) + ", то X = " + format(B, 0) + " × 100 / " + format(p, 0) + " = **" + format(X, 1) + "**.";
}
]
