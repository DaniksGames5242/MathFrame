[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 150; float b = 350; string info = ""; float avg = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "a"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "b"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "среднее"; size = 0.9 }
new UI { type = slider; label = "число a"; variable = a; min = 10; max = 500; step = 10; default = 150 }
new UI { type = slider; label = "число b"; variable = b; min = 10; max = 500; step = 10; default = 350 }
Function bar(n, x, v, c) { addNode(g, n + "0", [x, -3]); addNode(g, n + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, n + "0", n + "1", 1, c); }
float VMAX = 500;
Update {
  avg = (a + b) / 2;
  g = newGraph(); bar("a", -3, a, "#3b82f6"); bar("b", 0, b, "#f59e0b"); bar("c", 3, avg, "#22c55e");
  info = "Среднее значение: (" + format(a, 0) + " + " + format(b, 0) + ")/2 = **" + format(avg, 1) + "**. Среднее лежит между " + format(a, 0) + " и " + format(b, 0) + ".";
}
]
