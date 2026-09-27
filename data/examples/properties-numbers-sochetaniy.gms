[
description = "{info}"
field width = 14; field height = 9;
camera type = fixed;
float n = 6; float k = 2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "n"; variable = n; min = 4; max = 10; step = 1; default = 6 }
new UI { type = slider; label = "k"; variable = k; min = 0; max = n; step = 1; default = 2 }
Function fact(m) { float r = 1; repeat (12) { if (i < m) { r = r * (i + 1); } } return r; }
Function C(m, j) { if (j < 0) { return 0; } if (j > m) { return 0; } return fact(m) / (fact(j) * fact(m - j)); }
Update {
  float c1 = C(n, k); float c2 = C(n, n - k); float p1 = C(n - 1, k - 1); float p2 = C(n - 1, k);
  g = newGraph();
  addNode(g, "a0", [-3, -3.5]); addNode(g, "a1", [-3, -3.5 + 6 * c1 / 252]); addEdge(g, "a0", "a1", 1, "#3b82f6");
  addNode(g, "b0", [3, -3.5]); addNode(g, "b1", [3, -3.5 + 6 * c2 / 252]); addEdge(g, "b0", "b1", 1, "#f59e0b");
  info = "**Симметрия:** C(n,k) = C(n, n − k) — выбрать k элементов то же самое, что отметить n − k невыбранных: C(" + format(n,0) + "," + format(k,0) + ") = C(" + format(n,0) + "," + format(n-k,0) + ") = **" + format(c1,0) + "** (столбики равны).\n\n**Правило Паскаля:** C(n,k) = C(n−1,k−1) + C(n−1,k): " + format(c1,0) + " = " + format(p1,0) + " + " + format(p2,0) + ".";
}
]
