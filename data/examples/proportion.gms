[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 3; float b = 6; float c = 2; float d = 0; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "отношение"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "отношение"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "неизвестное"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = 1; max = 10; step = 0.5; default = 3 }
new UI { type = slider; label = "c"; variable = c; min = 0.5; max = 5; step = 0.5; default = 2 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 10;
Update {
  b = a * 2;
  d = b * c / a;
  g = newGraph(); bar("a", -3, a / b, "#3b82f6"); bar("b", 0, c / d, "#f59e0b"); bar("c", 3, d, "#22c55e");
  info = "Пропорция: " + format(a, 1) + "/" + format(b, 1) + " = " + format(c, 1) + "/x. Решение: x = " + format(c, 1) + " × " + format(b, 1) + "/" + format(a, 1) + " = **" + format(d, 1) + "**.";
}
]
