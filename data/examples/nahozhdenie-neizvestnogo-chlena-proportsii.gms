[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 2; float b = 6; float c = 8; string info = ""; float x = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "b"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "c"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "x"; size = 0.9 }
new UI { type = slider; label = "знач. a"; variable = a; min = 1; max = 20; step = 1; default = 2 }
new UI { type = slider; label = "знач. b"; variable = b; min = 1; max = 20; step = 1; default = 6 }
new UI { type = slider; label = "знач. c"; variable = c; min = 1; max = 20; step = 1; default = 8 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 20;
Update {
  x = b * c / a;
  VMAX = max(b, max(c, max(x, 0.01))) * 1.1;
  g = newGraph(); bar("a", -3, b, "#3b82f6"); bar("b", 0, c, "#f59e0b"); bar("c", 3, x, "#22c55e");
  info = "Пропорция " + format(a, 0) + "/b = " + format(c, 0) + "/x: найти x = b×" + format(c, 0) + "/" + format(a, 0) + ". При b = " + format(b, 0) + " получим x = " + format(b, 0) + "×" + format(c, 0) + "/" + format(a, 0) + " = **" + format(x, 1) + "**.";
}
]
