[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 3; float b = -5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-2, -3.6); text = "|a| + |b|"; size = 0.85 }
draw Text { name = "l2"; pos = (2, -3.6); text = "|a + b|"; size = 0.85 }
new UI { type = slider; label = "a"; variable = a; min = -10; max = 10; step = 0.5; default = 3 }
new UI { type = slider; label = "b"; variable = b; min = -10; max = 10; step = 0.5; default = -5 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / 20]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float v1 = abs(a) + abs(b); float v2 = abs(a + b);
  g = newGraph(); bar("p", -2, v1, "#3b82f6"); bar("q", 2, v2, "#22c55e");
  info = "**Неравенство треугольника:** |a| + |b| ≥ |a + b|.\n\nПри a = " + format(a, 1) + ", b = " + format(b, 1) + ": |a| + |b| = " + format(v1, 2) + ", |a + b| = " + format(v2, 2) + ". Равенство — только когда a и b одного знака (или один из них 0).";
}
]
