[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float d1 = 8; float e1 = 7; float d2 = 3; float e2 = 2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "единицы"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "десятки"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "результат"; size = 0.9 }
new UI { type = slider; label = "дес. первого"; variable = d1; min = 3; max = 9; step = 1; default = 8 }
new UI { type = slider; label = "ед. первого"; variable = e1; min = 0; max = 9; step = 1; default = 7 }
new UI { type = slider; label = "дес. второго"; variable = d2; min = 1; max = 8; step = 1; default = 3 }
new UI { type = slider; label = "ед. второго"; variable = e2; min = 0; max = 9; step = 1; default = 2 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 100;
Update {
  float a1 = d1 * 10 + e1;
  float a2 = d2 * 10 + e2;
  if (a2 > a1) { a2 = a1 - 1; }
  float r = a1 - a2;
  float ue = 0; float ud = 0;
  ue = e1 - e2; ud = d1 - d2;
  if (ue < 0) { ue = ue + 10; ud = ud - 1; }
  g = newGraph(); bar("a", -3, ue, "#3b82f6"); bar("b", 0, ud, "#f59e0b"); bar("c", 3, r / 10, "#22c55e");
  info = format(d1, 0) + format(e1, 0) + " − " + format(d2, 0) + format(e2, 0) + " = **" + format(r, 0) + "**.";
}
]
