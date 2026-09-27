[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 56; float b = 7; string info = ""; float q = 0; float r = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "Делимое"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "Делитель"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "Частное"; size = 0.9 }
new UI { type = slider; label = "делимое a"; variable = a; min = 20; max = 100; step = 4; default = 56 }
new UI { type = slider; label = "делитель b"; variable = b; min = 2; max = 12; step = 1; default = 7 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 100;
Update {
  if (abs(b - 1) < 0.05) { b = 1.1; } q = a / b; r = a - b * q;
  g = newGraph(); bar("a", -3, a, "#3b82f6"); bar("b", 0, b * 5, "#f59e0b"); bar("c", 3, q, "#22c55e");
  string s = ""; if (r > 0.01) { s = " + " + format(r, 0) + " (ост.)"; }
  info = format(a, 0) + " : " + format(b, 0) + " = " + format(q, 0) + s + ". Проверка: " + format(q, 0) + " × " + format(b, 0) + s + " = **" + format(a, 0) + "**.";
}
]
