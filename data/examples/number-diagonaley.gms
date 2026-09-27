[
description = "{info}"
field width = 12; field height = 12;
camera type = fixed;
float n = 6; string info = ""; float g = 0;
Function ang(k) { return pi / 2 + 2 * pi * k / n; }
new UI { type = slider; label = "число вершин n"; variable = n; min = 3; max = 8; step = 1; default = 6 }
draw Graph { name = "gr"; graph = "g"; nodeRadius = 5; labels = false }
Update {
  n = round(n);
  g = newGraph();
  repeat (n) { addNode(g, format(i, 0), [4.5 * cos(ang(i)), 4.5 * sin(ang(i))]); }
  repeat (n) { float j = i + 1; if (j >= n) { j = 0; } addEdge(g, format(i, 0), format(j, 0)); }
  repeat (n) { float ii = i; repeat (n) { if (i > ii + 1 && !(ii == 0 && i == n - 1)) { addEdge(g, format(ii, 0), format(i, 0), 1, "#f59e0b"); } } }
  float d = n * (n - 3) / 2;
  info = "Оранжевым — все **диагонали**: отрезки между несоседними вершинами. Их число d = n(n − 3)/2 = " + format(n, 0) + "×" + format(n - 3, 0) + "/2 = " + format(d, 0) + ".";
}
]
