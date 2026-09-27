[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 0.6; string info = ""; float r = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "sin²α"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "cos²α"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "сумма"; size = 0.9 }
new UI { type = slider; label = "α (рад)"; variable = a; min = 0; max = 6.28; step = 0.1; default = 0.6 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 1;
Update {
  float sa = sin(a); float ca = cos(a);
  r = sa * sa + ca * ca;
  g = newGraph(); bar("a", -3, sa * sa, "#3b82f6"); bar("b", 0, ca * ca, "#f59e0b"); bar("c", 3, r, "#22c55e");
  info = "sin²(" + format(a, 2) + ") = " + format(sa * sa, 2) + ", cos²(" + format(a, 2) + ") = " + format(ca * ca, 2) + ", сумма = **" + format(r, 2) + "**.";
}
]
