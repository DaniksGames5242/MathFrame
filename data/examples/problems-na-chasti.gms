[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float S = 300; float k = 2; string info = ""; float p1 = 0; float p2 = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "целое"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "часть 1"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "часть 2"; size = 0.9 }
new UI { type = slider; label = "целое S"; variable = S; min = 50; max = 500; step = 10; default = 300 }
new UI { type = slider; label = "отношение 1:k"; variable = k; min = 1; max = 5; step = 0.5; default = 2 }
Function bar(n, x, v, c) { addNode(g, n + "0", [x, -3]); addNode(g, n + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, n + "0", n + "1", 1, c); }
float VMAX = 500;
Update {
  p1 = S / (1 + k);
  p2 = S * k / (1 + k);
  g = newGraph(); bar("s", -3, S, "#3b82f6"); bar("p1", 0, p1, "#f59e0b"); bar("p2", 3, p2, "#22c55e");
  info = "Целое " + format(S, 0) + " разделено в отношении 1:" + format(k, 1) + ". Части: " + format(p1, 1) + " и " + format(p2, 1) + ". Проверка: " + format(p1 + p2, 1) + " = " + format(S, 0) + ".";
}
]
