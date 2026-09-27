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
  g = newGraph(); float step = 13 / (n + 1); float i = 0; float best = 0; float bestP = -1;
  repeat (n + 1) { float pi = C(n, i) * pow(p, i) * pow(1 - p, n - i); if (pi > bestP) { bestP = pi; best = i; } i = i + 1; }
  i = 0;
  repeat (n + 1) { float pi = C(n, i) * pow(p, i) * pow(1 - p, n - i); string col = "#3b82f6"; if (abs(i - best) < 0.5) { col = "#22c55e"; } bar("b" + i, -6.5 + step * (i + 0.5), pi * 2.5, col); i = i + 1; }
  info = "**Наивероятнейшее число успехов** — то k, для которого P(k) максимальна (зелёный столбик). При n = " + format(n, 0) + ", p = " + format(p, 2) + " это k = " + format(best, 0) + " с вероятностью P(" + format(best, 0) + ") = " + format(bestP, 4) + ".";
}
]
