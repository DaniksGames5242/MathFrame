[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 1.5; float b = 1; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "a³"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "3a²b+3ab²"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "b³"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 2.5; step = 0.1; default = 1.5 }
new UI { type = slider; label = "b"; variable = b; min = 0.5; max = 2; step = 0.1; default = 1 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 20;
Update {
  float a3 = a * a * a; float b3 = b * b * b; float mid = 3 * a * a * b + 3 * a * b * b;
  g = newGraph(); bar("a", -3, a3, "#3b82f6"); bar("b", 0, mid, "#f59e0b"); bar("c", 3, b3, "#22c55e");
  info = "**(a + b)³ = a³ + 3a²b + 3ab² + b²** при a = " + format(a, 1) + ", b = " + format(b, 1) + ": a³ = " + format(a3, 2) + ", 3a²b + 3ab² = " + format(mid, 2) + ", b³ = " + format(b3, 2) + ".";
}
]
