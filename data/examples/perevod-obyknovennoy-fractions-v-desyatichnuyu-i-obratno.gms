[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float n = 3; float d = 5; string info = ""; float dec = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "числител"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "знаменат"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "десят."; size = 0.9 }
new UI { type = slider; label = "числитель"; variable = n; min = 1; max = 9; step = 1; default = 3 }
new UI { type = slider; label = "знаменатель"; variable = d; min = 2; max = 10; step = 1; default = 5 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 1;
Update {
  dec = n / d;
  g = newGraph(); bar("a", -3, n / 10, "#3b82f6"); bar("b", 0, d / 10, "#f59e0b"); bar("c", 3, dec, "#22c55e");
  info = format(n, 0) + "/" + format(d, 0) + " = " + format(n, 0) + " ÷ " + format(d, 0) + " = **" + format(dec, 3) + "**.";
}
]
