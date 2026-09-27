[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 7; float b = 8; string info = ""; float p = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "Множитель a"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "Множитель b"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "Произведение"; size = 0.9 }
new UI { type = slider; label = "множитель a"; variable = a; min = 2; max = 10; step = 1; default = 7 }
new UI { type = slider; label = "множитель b"; variable = b; min = 2; max = 10; step = 1; default = 8 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 100;
Update {
  p = a * b;
  g = newGraph(); bar("a", -3, a * 5, "#3b82f6"); bar("b", 0, b * 5, "#f59e0b"); bar("c", 3, p, "#22c55e");
  info = format(a, 0) + " × " + format(b, 0) + " = " + format(p, 0) + ". Проверка делением: " + format(p, 0) + " : " + format(a, 0) + " = **" + format(b, 0) + "**.";
}
]
