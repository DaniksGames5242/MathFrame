[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 250; float b = 100; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "уменьш."; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "вычитаемое"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "разность"; size = 0.9 }
new UI { type = slider; label = "уменьшаемое a"; variable = a; min = 100; max = 400; step = 10; default = 250 }
new UI { type = slider; label = "вычитаемое b"; variable = b; min = 10; max = 300; step = 10; default = 100 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 500;
Update {
  if (b > a) { b = a - 10; }
  float r = a - b;
  g = newGraph(); bar("a", -3, a, "#3b82f6"); bar("b", 0, b, "#f59e0b"); bar("c", 3, r, "#22c55e");
  info = format(a, 0) + " − " + format(b, 0) + " = **" + format(r, 0) + "** (проверка: " + format(b, 0) + " + " + format(r, 0) + " = " + format(a, 0) + ").";
}
]
