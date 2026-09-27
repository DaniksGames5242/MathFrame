[
description = "{info}"
field width = 18; field height = 10;
camera type = fixed;
float m4 = 4; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 45; edgeCap = butt; labels = false; interactive = false }
new UI { type = slider; label = "частота m₄ интервала [15;20)"; variable = m4; min = 0; max = 10; step = 1; default = 4 }
Function bar(k, x, m) { addNode(g, "a"+k, [x, -4]); addNode(g, "b"+k, [x, -4 + m * 0.7]); addEdge(g, "a"+k, "b"+k, 1, "#3b82f6"); }
Update {
  m4 = round(m4);
  g = newGraph();
  bar("1", -6, 3); bar("2", -2, 5); bar("3", 2, 2); bar("4", 6, m4);
  float n = 3 + 5 + 2 + m4;
  info = "Гистограмма частот выборки объёма n = " + format(n,0) + ", разбитой на 4 равных интервала. Высота столбика — частота попадания значений в интервал: [0;5) — 3, [5;10) — 5, [10;15) — 2, [15;20) — " + format(m4,0) + ".";
}
]
