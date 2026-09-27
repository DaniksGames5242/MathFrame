[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float n1 = 3; float n2 = 2; string info = ""; float r = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "n₁/4"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "n₂/5"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "частное"; size = 0.9 }
new UI { type = slider; label = "n₁"; variable = n1; min = 1; max = 8; step = 1; default = 3 }
new UI { type = slider; label = "n₂"; variable = n2; min = 1; max = 8; step = 1; default = 2 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 3;
Update {
  r = (n1 * 5) / (4 * n2);
  g = newGraph(); bar("a", -3, n1 / 4, "#3b82f6"); bar("b", 0, n2 / 5, "#f59e0b"); bar("c", 3, r, "#22c55e");
  info = format(n1, 0) + "/4 ÷ " + format(n2, 0) + "/5 = " + format(n1, 0) + "/4 × 5/" + format(n2, 0) + " = **" + format(r, 2) + "**.";
}
]
