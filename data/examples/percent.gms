[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float A = 200; float p = 30; string info = ""; float r = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "целое"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "процент"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "остаток"; size = 0.9 }
new UI { type = slider; label = "целое A"; variable = A; min = 50; max = 500; step = 10; default = 200 }
new UI { type = slider; label = "процент p"; variable = p; min = 5; max = 95; step = 5; default = 30 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 500;
Update {
  r = A * p / 100;
  g = newGraph(); bar("a", -3, A, "#3b82f6"); bar("b", 0, r, "#f59e0b"); bar("c", 3, A - r, "#22c55e");
  info = format(p, 0) + "% от " + format(A, 0) + " = " + format(A, 0) + " × " + format(p, 0) + "/100 = **" + format(r, 1) + "**.";
}
]
