[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float k = 2; float whole = 60; string info = ""; float part1 = 0; float part2 = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "часть 1"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "часть 2"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "целое"; size = 0.9 }
new UI { type = slider; label = "отношение k"; variable = k; min = 0.5; max = 5; step = 0.5; default = 2 }
new UI { type = slider; label = "целое"; variable = whole; min = 30; max = 150; step = 10; default = 60 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 150;
Update {
  part1 = whole * k / (k + 1);
  part2 = whole - part1;
  g = newGraph(); bar("a", -3, part1, "#3b82f6"); bar("b", 0, part2, "#f59e0b"); bar("c", 3, whole, "#22c55e");
  info = "Отношение частей k = " + format(k, 1) + ". Целое = " + format(whole, 0) + ", части: **" + format(part1, 1) + "** и **" + format(part2, 1) + "**.";
}
]
