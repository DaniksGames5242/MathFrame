[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 96; float b = 6; string info = ""; float q = 0; float r = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "Делимое"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "Делитель"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "Частное"; size = 0.9 }
new UI { type = slider; label = "делимое"; variable = a; min = 30; max = 180; step = 6; default = 96 }
new UI { type = slider; label = "делитель"; variable = b; min = 2; max = 12; step = 1; default = 6 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 180;
Update {
  if (abs(b - 1) < 0.05) { b = 1.1; } q = a / b; r = a - b * q;
  g = newGraph(); bar("a", -3, a, "#3b82f6"); bar("b", 0, b * 15, "#f59e0b"); bar("c", 3, q * 10, "#22c55e");
  string s = ""; if (r > 0.01) { s = " (ост. " + format(r, 0) + ")"; }
  info = format(a, 0) + " : " + format(b, 0) + " = " + format(q, 0) + s + "; проверка: " + format(q, 0) + " × " + format(b, 0) + " = **" + format(a - r, 0) + "**.";
}
]
