[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float x1 = 100; float w1 = 2; float x2 = 200; float w2 = 3; string info = ""; float weighted = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "x₁"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "x₂"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "взв.сред"; size = 0.9 }
new UI { type = slider; label = "x₁"; variable = x1; min = 10; max = 500; step = 10; default = 100 }
new UI { type = slider; label = "w₁"; variable = w1; min = 1; max = 5; step = 1; default = 2 }
new UI { type = slider; label = "x₂"; variable = x2; min = 10; max = 500; step = 10; default = 200 }
new UI { type = slider; label = "w₂"; variable = w2; min = 1; max = 5; step = 1; default = 3 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 500;
Update {
  weighted = (w1 * x1 + w2 * x2) / (w1 + w2);
  g = newGraph(); bar("a", -3, x1, "#3b82f6"); bar("b", 0, x2, "#f59e0b"); bar("c", 3, weighted, "#22c55e");
  info = "Взвешенное среднее: (" + format(w1, 0) + "×" + format(x1, 0) + " + " + format(w2, 0) + "×" + format(x2, 0) + ")/(" + format(w1, 0) + " + " + format(w2, 0) + ") = **" + format(weighted, 1) + "**.";
}
]
