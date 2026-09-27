[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float m = 3; string info = ""; float cm = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "м"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "× 100"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "см"; size = 0.9 }
new UI { type = slider; label = "длина (м)"; variable = m; min = 1; max = 10; step = 1; default = 3 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 1000;
Update {
  cm = m * 100;
  g = newGraph(); bar("a", -3, m, "#3b82f6"); bar("b", 0, 100, "#f59e0b"); bar("c", 3, cm / 100, "#22c55e");
  info = "Перевод единиц: " + format(m, 1) + " м × 100 = **" + format(cm, 0) + " см**.";
}
]
