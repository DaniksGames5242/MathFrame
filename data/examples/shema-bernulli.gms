[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float n = 10; float p = 0.5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 16; labels = false; interactive = false }
new UI { type = slider; label = "число испытаний n"; variable = n; min = 2; max = 15; step = 1; default = 10 }
new UI { type = slider; label = "вероятность успеха p"; variable = p; min = 0.05; max = 0.95; step = 0.05; default = 0.5 }
Function C(n, k) { float res = 1; float j = 0; repeat (k) { res = res * (n - j) / (j + 1); j = j + 1; } return res; }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -4]); addNode(g, k + "1", [x, -4 + 8 * v]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  g = newGraph(); float step = 13 / (n + 1); float k = 0;
  repeat (n + 1) { float pk = C(n, k) * pow(p, k) * pow(1 - p, n - k); bar("b" + k, -6.5 + step * (k + 0.5), pk * 2.5, "#3b82f6"); k = k + 1; }
  info = "**Схема Бернулли**: n независимых испытаний, в каждом вероятность успеха p одна и та же. Столбики — вероятности P(k) ровно k успехов из n при n = " + format(n, 0) + ", p = " + format(p, 2) + ".";
}
]
