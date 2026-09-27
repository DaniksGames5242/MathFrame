[
description = "{info}"
field width = 20; field height = 6;
camera type = fixed;
float m = 2; float n = 3; float p = 4; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 26; labels = false; interactive = false }
new UI { type = slider; label = "m"; variable = m; min = 1; max = 6; step = 1; default = 2 }
new UI { type = slider; label = "n"; variable = n; min = 1; max = 6; step = 1; default = 3 }
new UI { type = slider; label = "p"; variable = p; min = 1; max = 6; step = 1; default = 4 }
Function bar(x, v, vmax, c) { addNode(g, "a" + format(x, 0), [x, -2]); addNode(g, "b" + format(x, 0), [x, -2 + 3.6 * v / vmax]); addEdge(g, "a" + format(x, 0), "b" + format(x, 0), 1, c); }
Update {
  float s1 = p - 1; float s2 = n * s1; float s3 = m + s2; float s4 = s3 * s3;
  g = newGraph(); bar(-6, s1, 5, "#3b82f6"); bar(-2, s2, 30, "#f59e0b"); bar(2, s3, 36, "#22c55e"); bar(6, s4, 1296, "#22c55e");
  info = "**Числовое выражение** вычисляется по приоритету операций: сначала скобки, потом степень, потом умножение, потом сложение.\n\n(" + format(m, 0) + " + " + format(n, 0) + "·(" + format(p, 0) + " − 1))²: (" + format(p, 0) + " − 1) = " + format(s1, 0) + ", далее " + format(n, 0) + "·" + format(s1, 0) + " = " + format(s2, 0) + ", далее " + format(m, 0) + " + " + format(s2, 0) + " = " + format(s3, 0) + ", наконец " + format(s3, 0) + "² = **" + format(s4, 0) + "**.";
}
]
