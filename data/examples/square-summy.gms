[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 2; float b = 1; string info = ""; float r = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "a²"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "2ab"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "b²"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 4; step = 0.1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = 0.5; max = 3; step = 0.1; default = 1 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 36;
Update {
  float a2 = a * a; float b2 = b * b; float ab2 = 2 * a * b;
  g = newGraph(); bar("a", -3, a2, "#3b82f6"); bar("b", 0, ab2, "#f59e0b"); bar("c", 3, b2, "#22c55e");
  info = "**（a + b)² = a² + 2ab + b²** при a = " + format(a, 1) + ", b = " + format(b, 1) + ": a² = " + format(a2, 1) + ", 2ab = " + format(ab2, 1) + ", b² = " + format(b2, 1) + ", сумма = " + format(a2 + ab2 + b2, 1) + ".";
}
]
