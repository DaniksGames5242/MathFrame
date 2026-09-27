[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float n1 = 1; float d1 = 2; float n2 = 1; float d2 = 4; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "Дробь 1"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "Дробь 2"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "Сумма"; size = 0.9 }
new UI { type = slider; label = "числитель 1"; variable = n1; min = 1; max = 4; step = 1; default = 1 }
new UI { type = slider; label = "числитель 2"; variable = n2; min = 1; max = 4; step = 1; default = 1 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 1;
Update {
  if (n1 > d1) { n1 = d1; } if (n2 > d2) { n2 = d2; }
  float v1 = n1 / d1; float v2 = n2 / d2; float s = v1 + v2;
  g = newGraph(); bar("a", -3, v1, "#3b82f6"); bar("b", 0, v2, "#f59e0b"); bar("c", 3, s, "#22c55e");
  info = format(n1, 0) + "/" + format(d1, 0) + " + " + format(n2, 0) + "/" + format(d2, 0) + " = " + format(v1 + v2, 2) + ". Знаменатель 4: " + format(n1 * 2, 0) + "/4 + " + format(n2, 0) + "/4 = **" + format(n1 * 2 + n2, 0) + "/4**.";
}
]
