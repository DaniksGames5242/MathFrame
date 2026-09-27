[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float X = 180; float p = 60; string info = ""; float N = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "часть X"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "число N"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "остаток"; size = 0.9 }
new UI { type = slider; label = "часть X"; variable = X; min = 50; max = 400; step = 10; default = 180 }
new UI { type = slider; label = "доля p/100"; variable = p; min = 20; max = 80; step = 5; default = 60 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 500;
Update {
  N = X * 100 / p;
  g = newGraph(); bar("a", -3, X, "#3b82f6"); bar("b", 0, N, "#f59e0b"); bar("c", 3, N - X, "#22c55e");
  info = "Если " + format(p, 0) + "/100 от N равно " + format(X, 0) + ", то N = " + format(X, 0) + " × 100/" + format(p, 0) + " = **" + format(N, 1) + "**.";
}
]
