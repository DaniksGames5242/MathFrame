[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float P = 200; float r = 8; string info = ""; float S = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "вклад"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "ставка %"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "итого"; size = 0.9 }
new UI { type = slider; label = "вклад P"; variable = P; min = 50; max = 400; step = 10; default = 200 }
new UI { type = slider; label = "ставка r"; variable = r; min = 2; max = 15; step = 0.5; default = 8 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 450;
Update {
  S = P * (1 + r / 100);
  g = newGraph(); bar("a", -3, P, "#3b82f6"); bar("b", 0, P * r / 100, "#f59e0b"); bar("c", 3, S, "#22c55e");
  info = "За один год: S = " + format(P, 0) + " × (1 + " + format(r, 1) + "/100) = **" + format(S, 1) + "**.";
}
]
