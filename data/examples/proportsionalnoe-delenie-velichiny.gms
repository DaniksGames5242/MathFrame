[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float T = 300; float m = 3; float n = 5; string info = ""; float p1 = 0; float p2 = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "часть m"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "часть n"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "всего"; size = 0.9 }
new UI { type = slider; label = "целое T"; variable = T; min = 50; max = 500; step = 10; default = 300 }
new UI { type = slider; label = "коэфф. m"; variable = m; min = 1; max = 10; step = 1; default = 3 }
new UI { type = slider; label = "коэфф. n"; variable = n; min = 1; max = 10; step = 1; default = 5 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 500;
Update {
  p1 = T * m / (m + n);
  p2 = T * n / (m + n);
  g = newGraph(); bar("a", -3, p1, "#3b82f6"); bar("b", 0, p2, "#f59e0b"); bar("c", 3, T, "#22c55e");
  info = "Деление " + format(T, 0) + " в отношении " + format(m, 0) + ":" + format(n, 0) + ": части = " + format(p1, 1) + " и " + format(p2, 1) + ", всего **" + format(T, 0) + "**.";
}
]
