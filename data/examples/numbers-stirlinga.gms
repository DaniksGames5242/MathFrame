[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float n = 5; float k = 2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 16; labels = false; interactive = false }
new UI { type = slider; label = "n"; variable = n; min = 1; max = 8; step = 1; default = 5 }
new UI { type = slider; label = "k"; variable = k; min = 1; max = n; step = 1; default = 2 }
Update {
  g = newGraph(); float mx = 1; repeat (9) { float j = i + 1; if (j <= n) { mx = max(mx, num(stirling2(n, j))); } }
  repeat (9) { float j = i + 1; if (j <= n) { float s = num(stirling2(n, j)); string c = "#3b82f6"; if (j == k) { c = "#f59e0b"; }
    addNode(g, "a" + format(j, 0), [-7 + j * 1.75, -4.3]); addNode(g, "b" + format(j, 0), [-7 + j * 1.75, -4.3 + 7.5 * s / mx]); addEdge(g, "a" + format(j, 0), "b" + format(j, 0), 1, c); } }
  info = "**Число Стирлинга второго рода** S(n, k) — количество разбиений n-элементного множества на k непустых непересекающихся подмножеств.\n\nСтолбики — S(n, 1), …, S(n, n) при n = " + format(n, 0) + ". S(" + format(n, 0) + ", " + format(k, 0) + ") = " + format(stirling2(n, k), 0) + ".";
}
]
