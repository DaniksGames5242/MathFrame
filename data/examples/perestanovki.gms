[
description = "{info}"
field width = 14; field height = 8;
camera type = fixed;
float n = 4; string info = ""; float fact = 1;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 22; labels = false; interactive = false }
new UI { type = slider; label = "число элементов n"; variable = n; min = 1; max = 7; step = 1; default = 4 }
Function bar(k, xp, v, c) { addNode(g, k + "0", [xp, -3.5]); addNode(g, k + "1", [xp, -3.5 + 6.5 * v / 5040]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  g = newGraph();
  float f = 1; float j = 0;
  repeat (7) { j = j + 1; f = f * j; string c = "#3b82f6"; if (j == n) { c = "#f59e0b"; fact = f; } bar("b" + format(j, 0), -6.4 + 1.6 * j, f, c); }
  info = "**Перестановки**: число способов расставить n = " + format(n, 0) + " различных элементов в ряд, где порядок важен, равно n! = " + format(fact, 0) + " (столбики показывают рост 1!, 2!, …, 7! — текущее n выделено оранжевым).";
}
]
