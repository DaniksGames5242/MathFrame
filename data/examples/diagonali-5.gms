[
description = "{info}"
field width = 12; field height = 12;
camera type = fixed;
float n = 6; string info = ""; float g = 0;
Function ang(k) { return pi / 2 + 2 * pi * k / n; }
new UI { type = slider; label = "число вершин n"; variable = n; min = 4; max = 9; step = 1; default = 6 }
draw Graph { name = "gr"; graph = "g"; nodeRadius = 5; labels = false }
Update {
  n = round(n);
  g = newGraph();
  repeat (n) { addNode(g, format(i, 0), [4.5 * cos(ang(i)), 4.5 * sin(ang(i))]); }
  repeat (n) { float j = i + 1; if (j >= n) { j = 0; } addEdge(g, format(i, 0), format(j, 0)); }
  repeat (n) { if (i >= 2 && i <= n - 2) { addEdge(g, "0", format(i, 0), 1, "#f59e0b"); } }
  info = "Из вершины 0 (справа) проведены **диагонали** — отрезки к несоседним вершинам (оранжевые); их n − 3 = " + format(n - 3, 0) + ". Стороны — отрезки между соседними вершинами, обычным цветом.";
}
]
