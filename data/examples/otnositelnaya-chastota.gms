[
description = "{info}"
field width = 20; field height = 10;
camera type = fixed;
float v = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; labels = false; interactive = false }
new UI { type = slider; label = "значение v"; variable = v; min = 1; max = 7; step = 1; default = 3 }
Function bar(k, x, p, sel) { string c = "#3b82f6"; if (sel) { c = "#f59e0b"; } addNode(g, "a"+k, [x, -4]); addNode(g, "b"+k, [x, -4 + p * 20]); addEdge(g, "a"+k, "b"+k, 1, c); }
Update {
  v = round(v);
  g = newGraph();
  bar("1", -9, 0.0, v == 1); bar("2", -6, 0.125, v == 2); bar("3", -3, 0.25, v == 3); bar("4", 0, 0.375, v == 4); bar("5", 3, 0.125, v == 5); bar("6", 6, 0.0, v == 6); bar("7", 9, 0.125, v == 7);
  float m = 0; if (v == 1) { m = 0; } if (v == 2) { m = 1; } if (v == 3) { m = 2; } if (v == 4) { m = 3; } if (v == 5) { m = 1; } if (v == 6) { m = 0; } if (v == 7) { m = 1; }
  float w = m / 8;
  info = "Выборка объёма n = 8. Относительная частота значения v = " + format(v,0) + " равна w = m/n = " + format(m,0) + "/8 = **" + format(w,3) + "**.";
}
]
