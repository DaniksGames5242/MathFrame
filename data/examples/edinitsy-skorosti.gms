[
description = "{info}"
field width = 10; field height = 10;
camera type = fixed;
float v = 72; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; edgeCap = butt; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-2.5, -4.6); text = "км/ч"; size = 0.85 }
draw Text { name = "l2"; pos = (2.5, -4.6); text = "м/с"; size = 0.85 }
new UI { type = slider; label = "скорость v (км/ч)"; variable = v; min = 5; max = 150; step = 1; default = 72 }
Update {
  float ms = v / 3.6;
  g = newGraph();
  addNode(g, "a0", [-2.5, -4]); addNode(g, "a1", [-2.5, -4 + 8 * v / 150]); addEdge(g, "a0", "a1", 1, "#3b82f6");
  addNode(g, "b0", [2.5, -4]); addNode(g, "b1", [2.5, -4 + 8 * ms / 41.7]); addEdge(g, "b0", "b1", 1, "#f59e0b");
  info = "**Перевод скорости**: v = " + format(v, 0) + " км/ч = " + format(v, 0) + "×1000 м / 3600 с = " + format(ms, 2) + " м/с.";
}
]
