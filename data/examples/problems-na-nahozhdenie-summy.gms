[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float x = 10; float d = 5; string info = ""; float sum = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "число 1"; size = 0.85 }
draw Text { name = "l2"; pos = (0, -3.5); text = "число 2"; size = 0.85 }
draw Text { name = "l3"; pos = (3, -3.5); text = "сумма"; size = 0.85 }
new UI { type = slider; label = "число 1"; variable = x; min = 5; max = 15; step = 1; default = 10 }
new UI { type = slider; label = "разница"; variable = d; min = 1; max = 10; step = 1; default = 5 }
Function bar(k, x_pos, v, c) { addNode(g, k + "0", [x_pos, -3]); addNode(g, k + "1", [x_pos, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 40;
Update {
  sum = x + (x + d);
  g = newGraph(); bar("a", -3, x, "#3b82f6"); bar("b", 0, x + d, "#f59e0b"); bar("c", 3, sum, "#22c55e");
  info = "Задача на сумму: " + format(x, 0) + " + " + format(x + d, 0) + " = **" + format(sum, 0) + "**.";
}
]
