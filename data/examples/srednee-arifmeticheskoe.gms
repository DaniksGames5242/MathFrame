[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 100; float b = 300; string info = ""; float avg = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "a"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "b"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "среднее"; size = 0.9 }
new UI { type = slider; label = "число a"; variable = a; min = 10; max = 500; step = 10; default = 100 }
new UI { type = slider; label = "число b"; variable = b; min = 10; max = 500; step = 10; default = 300 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 500;
Update {
  avg = (a + b) / 2;
  g = newGraph(); bar("a", -3, a, "#3b82f6"); bar("b", 0, b, "#f59e0b"); bar("c", 3, avg, "#22c55e");
  info = "Среднее арифметическое двух чисел: (" + format(a, 0) + " + " + format(b, 0) + ")/2 = **" + format(avg, 1) + "**.";
}
]
