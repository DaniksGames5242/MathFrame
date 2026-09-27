[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 12; float b = 5; string info = ""; float diff = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "больше"; size = 0.85 }
draw Text { name = "l2"; pos = (0, -3.5); text = "меньше"; size = 0.85 }
draw Text { name = "l3"; pos = (3, -3.5); text = "разн."; size = 0.85 }
new UI { type = slider; label = "большое число"; variable = a; min = 8; max = 20; step = 1; default = 12 }
new UI { type = slider; label = "малое число"; variable = b; min = 2; max = 10; step = 1; default = 5 }
Function bar(k, x_pos, v, c) { addNode(g, k + "0", [x_pos, -3]); addNode(g, k + "1", [x_pos, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 20;
Update {
  diff = a - b;
  g = newGraph(); bar("a", -3, a, "#3b82f6"); bar("b", 0, b, "#f59e0b"); bar("c", 3, diff, "#22c55e");
  info = "Задача на разность: " + format(a, 0) + " − " + format(b, 0) + " = **" + format(diff, 0) + "**.";
}
]
