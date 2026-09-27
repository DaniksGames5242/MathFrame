[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float n1 = 3; float d1 = 4; float n2 = 1; float d2 = 6; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "Дробь 1"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "Дробь 2"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "Разность"; size = 0.9 }
new UI { type = slider; label = "числитель 1"; variable = n1; min = 1; max = 5; step = 1; default = 3 }
new UI { type = slider; label = "числитель 2"; variable = n2; min = 1; max = 3; step = 1; default = 1 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 1;
Update {
  if (n1 > d1) { n1 = d1; } if (n2 > d2) { n2 = d2; }
  float v1 = n1 / d1; float v2 = n2 / d2; float d = v1 - v2;
  g = newGraph(); bar("a", -3, v1, "#3b82f6"); bar("b", 0, v2, "#f59e0b"); bar("c", 3, d, "#22c55e");
  info = format(n1, 0) + "/" + format(d1, 0) + " − " + format(n2, 0) + "/" + format(d2, 0) + " = " + format(d, 2) + ". Знаменатель 12: " + format(n1 * 3, 0) + "/12 − " + format(n2 * 2, 0) + "/12 = **" + format(n1 * 3 - n2 * 2, 0) + "/12**.";
}
]
