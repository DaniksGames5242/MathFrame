[
description = "{info}"
field width = 20; field height = 10;
camera type = fixed;
float m4 = 4; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 5; edgeWidth = 3; labels = false; interactive = false; color = #3b82f6 }
new UI { type = slider; label = "частота m₄ интервала [15;20)"; variable = m4; min = 0; max = 10; step = 1; default = 4 }
Update {
  m4 = round(m4);
  g = newGraph();
  addNode(g, "p0", [-8, -4]); addNode(g, "p1", [-6, -4 + 3 * 0.7]); addNode(g, "p2", [-2, -4 + 5 * 0.7]); addNode(g, "p3", [2, -4 + 2 * 0.7]); addNode(g, "p4", [6, -4 + m4 * 0.7]); addNode(g, "p5", [10, -4]);
  addEdge(g, "p0", "p1"); addEdge(g, "p1", "p2"); addEdge(g, "p2", "p3"); addEdge(g, "p3", "p4"); addEdge(g, "p4", "p5");
  float n = 3 + 5 + 2 + m4;
  info = "Полигон частот выборки (n = " + format(n,0) + "): вершины — середины интервалов [0;5), [5;10), [10;15), [15;20) с частотами 3, 5, 2, " + format(m4,0) + ", соединённые отрезками.";
}
]
