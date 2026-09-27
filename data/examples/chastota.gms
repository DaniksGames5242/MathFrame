[
description = "{info}"
field width = 20; field height = 10;
camera type = fixed;
float v = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; labels = false; interactive = false }
new UI { type = slider; label = "значение v"; variable = v; min = 1; max = 7; step = 1; default = 3 }
Function bar(k, x, m, sel) { string c = "#3b82f6"; if (sel) { c = "#f59e0b"; } addNode(g, "a"+k, [x, -4]); addNode(g, "b"+k, [x, -4 + m * 2.5]); addEdge(g, "a"+k, "b"+k, 1, c); }
Update {
  v = round(v);
  g = newGraph();
  bar("1", -9, 0, v == 1); bar("2", -6, 1, v == 2); bar("3", -3, 2, v == 3); bar("4", 0, 3, v == 4); bar("5", 3, 1, v == 5); bar("6", 6, 0, v == 6); bar("7", 9, 1, v == 7);
  float m = 0; if (v == 1) { m = 0; } if (v == 2) { m = 1; } if (v == 3) { m = 2; } if (v == 4) { m = 3; } if (v == 5) { m = 1; } if (v == 6) { m = 0; } if (v == 7) { m = 1; }
  info = "В выборке n = 8 значений (категории 1…7). Значение v = " + format(v,0) + " встречается **" + format(m,0) + "** раз(а) — это частота значения v.";
}
]
