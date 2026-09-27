[
description = "{info}"
field width = 18; field height = 10;
camera type = fixed;
float x5 = 5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; labels = false; interactive = false }
draw Graph { name = "ml"; graph = "gm"; nodeRadius = 0; edgeWidth = 3; labels = false; interactive = false; color = #f59e0b }
new UI { type = slider; label = "x₅"; variable = x5; min = 1; max = 10; step = 0.5; default = 5 }
Function bar(k, xp, val) { addNode(g, "a"+k, [xp, -4]); addNode(g, "b"+k, [xp, -4 + val * 0.7]); addEdge(g, "a"+k, "b"+k, 1, "#3b82f6"); }
Update {
  g = newGraph();
  bar("1", -8, 4); bar("2", -4, 7); bar("3", 0, 2); bar("4", 4, 6); bar("5", 8, x5);
  float mean = (4 + 7 + 2 + 6 + x5) / 5;
  gm = newGraph(); addNode(gm, "l1", [-9, -4 + mean * 0.7]); addNode(gm, "l2", [9, -4 + mean * 0.7]); addEdge(gm, "l1", "l2");
  info = "Выборка: 4, 7, 2, 6, " + format(x5,1) + " (n = 5).\n\nВыборочное среднее x̄ = (4+7+2+6+" + format(x5,1) + ")/5 = **" + format(mean,2) + "** (оранжевая линия).";
}
]
