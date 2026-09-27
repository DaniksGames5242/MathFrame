[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float A = 23; float B = 5; string info = ""; float q = 0; float r = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "делимое a"; variable = A; min = 1; max = 50; step = 1; default = 23 }
new UI { type = slider; label = "делитель b"; variable = B; min = 2; max = 12; step = 1; default = 5 }
Update {
  q = floor(A / B); r = A - B * q;
  float sc = 14 / 50; float x0 = -7;
  g = newGraph();
  addNode(g, "p0", [x0, 0]); addNode(g, "p1", [x0 + sc * B * q, 0]); addEdge(g, "p0", "p1", 1, "#3b82f6");
  addNode(g, "p2", [x0 + sc * B * q, 0]); addNode(g, "p3", [x0 + sc * A, 0]); addEdge(g, "p2", "p3", 1, "#f59e0b");
  info = "**Деление с остатком:** a = b · q + r, где 0 ≤ r < b, q — неполное частное.\n\n" + format(A, 0) + " = " + format(B, 0) + " × " + format(q, 0) + " + " + format(r, 0) + " (синим — b·q, оранжевым — остаток r).";
}
]
