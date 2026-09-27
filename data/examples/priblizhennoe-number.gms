[
description = "{info}"
field width = 16; field height = 5;
camera type = fixed;
float v = 5; float e = 0.6; string info = "";
draw Graph { name = "gI"; graph = "gi"; nodeRadius = 0; edgeWidth = 6; labels = false; interactive = false; edgeColor = #3b82f6 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = true }
show axes = true;
new UI { type = slider; label = "измеренное значение v"; variable = v; min = 1; max = 6; step = 0.1; default = 5 }
new UI { type = slider; label = "погрешность e"; variable = e; min = 0.05; max = 1.5; step = 0.05; default = 0.6 }
Update {
  gi = newGraph(); addNode(gi, "a", [v - e, 0]); addNode(gi, "b", [v + e, 0]); addEdge(gi, "a", "b");
  P.pos.x = v; P.pos.y = 0;
  info = "**Приближённое число** v = " + format(v, 2) + " ± " + format(e, 2) + ": истинная величина неизвестна точно, но лежит где-то в отрезке [" + format(v - e, 2) + "; " + format(v + e, 2) + "].";
}
]
