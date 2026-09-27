[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float v = 3.5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "числовое значение (в метрах)"; variable = v; min = 0.5; max = 10; step = 0.5; default = 3.5 }
Update {
  g = newGraph(); addNode(g, "0", [-4, -3]); addNode(g, "1", [-4 + v * 0.8, -3]); addEdge(g, "0", "1", 1, "#3b82f6");
  info = "**Величина = числовое значение × единица измерения**: при значении " + format(v, 1) + " и единице метр величина равна " + format(v, 1) + " м = " + format(v * 100, 0) + " см.";
}
]
