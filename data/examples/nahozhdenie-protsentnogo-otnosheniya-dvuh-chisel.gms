[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float B = 200; float A = 60; string info = ""; float p = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "B (целое)"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "A от B = p%"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "остаток"; size = 0.9 }
new UI { type = slider; label = "целое B"; variable = B; min = 50; max = 500; step = 10; default = 200 }
new UI { type = slider; label = "часть A"; variable = A; min = 10; max = 300; step = 10; default = 60 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 500;
Update {
  p = A * 100 / B;
  g = newGraph(); bar("a", -3, B, "#3b82f6"); bar("b", 0, A, "#f59e0b"); bar("c", 3, B - A, "#22c55e");
  info = "A = " + format(A, 0) + " составляет " + format(A, 0) + " × 100 / " + format(B, 0) + " = **" + format(p, 1) + "%** от B = " + format(B, 0) + ".";
}
]
