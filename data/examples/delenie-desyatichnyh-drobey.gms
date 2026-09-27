[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 5; float b = 1.25; string info = ""; float q = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "число a"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "число b"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "частное"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = 1; max = 10; step = 0.1; default = 5 }
new UI { type = slider; label = "b"; variable = b; min = 0.25; max = 3; step = 0.05; default = 1.25 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 10;
Update {
  q = a / b;
  g = newGraph(); bar("a", -3, a, "#3b82f6"); bar("b", 0, b, "#f59e0b"); bar("c", 3, q, "#22c55e");
  info = format(a, 2) + " ÷ " + format(b, 2) + " = **" + format(q, 2) + "**.";
}
]
