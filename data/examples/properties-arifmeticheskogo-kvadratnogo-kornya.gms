[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 9; float b = 4; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-2, -3.6); text = "√a · √b"; size = 0.85 }
draw Text { name = "l2"; pos = (2, -3.6); text = "√(a · b)"; size = 0.85 }
new UI { type = slider; label = "число a"; variable = a; min = 0; max = 25; step = 1; default = 9 }
new UI { type = slider; label = "число b"; variable = b; min = 0; max = 25; step = 1; default = 4 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / 25]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float v1 = sqrt(a) * sqrt(b); float v2 = sqrt(a * b);
  g = newGraph(); bar("p", -2, v1, "#3b82f6"); bar("q", 2, v2, "#22c55e");
  info = "**Корень из произведения:** √a · √b = √(a · b) для неотрицательных a, b.\n\nПри a = " + format(a, 0) + ", b = " + format(b, 0) + ": √a · √b = " + format(v1, 3) + " и √(a · b) = " + format(v2, 3) + " — столбики равны при любых a, b.";
}
]
