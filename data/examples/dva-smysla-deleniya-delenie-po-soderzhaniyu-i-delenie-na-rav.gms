[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float n = 12; float sz = 3; string info = ""; float k = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "Всего"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "На группу"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "Групп"; size = 0.9 }
new UI { type = slider; label = "всего предметов"; variable = n; min = 6; max = 24; step = 1; default = 12 }
new UI { type = slider; label = "в каждой группе"; variable = sz; min = 1; max = 6; step = 1; default = 3 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 24;
Update {
  if (abs(sz - 1) < 0.05) { sz = 1.1; }
  k = n / sz;
  g = newGraph(); bar("a", -3, n, "#3b82f6"); bar("b", 0, sz * 4, "#f59e0b"); bar("c", 3, k * 2, "#22c55e");
  info = format(n, 0) + " : " + format(sz, 0) + " = " + format(k, 1) + " — сколько групп по " + format(sz, 0) + " содержится в " + format(n, 0) + "; проверка: " + format(k, 1) + " × " + format(sz, 0) + " = **" + format(n, 0) + "**.";
}
]
