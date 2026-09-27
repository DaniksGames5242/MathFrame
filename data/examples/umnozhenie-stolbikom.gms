[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 25; float d1 = 2; float d0 = 3; string info = ""; float r = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "× на 10"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "× на 1"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "Итог"; size = 0.9 }
new UI { type = slider; label = "множимое"; variable = a; min = 10; max = 99; step = 1; default = 25 }
new UI { type = slider; label = "десятки"; variable = d1; min = 1; max = 9; step = 1; default = 2 }
new UI { type = slider; label = "единицы"; variable = d0; min = 0; max = 9; step = 1; default = 3 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 1000;
Update {
  float b = d1 * 10 + d0; float p1 = a * d1; float p2 = a * d0; r = a * b;
  g = newGraph(); bar("a", -3, p1, "#3b82f6"); bar("b", 0, p2, "#f59e0b"); bar("c", 3, r / 10, "#22c55e");
  info = format(a, 0) + " × " + format(b, 0) + " = " + format(a, 0) + "×(10+" + format(d0, 0) + ") = " + format(p1, 0) + "×10 + " + format(p2, 0) + " = **" + format(r, 0) + "**.";
}
]
