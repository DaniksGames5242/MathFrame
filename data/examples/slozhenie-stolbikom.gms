[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float e1 = 3; float d1 = 2; float e2 = 4; float d2 = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "единицы"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "десятки"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "сотни"; size = 0.9 }
new UI { type = slider; label = "ед. первого"; variable = e1; min = 0; max = 9; step = 1; default = 3 }
new UI { type = slider; label = "дес. первого"; variable = d1; min = 0; max = 9; step = 1; default = 2 }
new UI { type = slider; label = "ед. второго"; variable = e2; min = 0; max = 9; step = 1; default = 4 }
new UI { type = slider; label = "дес. второго"; variable = d2; min = 0; max = 9; step = 1; default = 3 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 20;
Update {
  float se = e1 + e2;
  float sd = d1 + d2;
  float ps = 0; float pd = 0;
  if (se >= 10) { ps = 1; se = se - 10; }
  pd = d1 + d2 + ps;
  if (pd >= 10) { pd = pd - 10; }
  g = newGraph(); bar("a", -3, se, "#3b82f6"); bar("b", 0, sd, "#f59e0b"); bar("c", 3, pd, "#22c55e");
  info = format(d1, 0) + format(e1, 0) + " + " + format(d2, 0) + format(e2, 0) + " = " + format(pd, 0) + format(se, 0) + ".";
}
]
