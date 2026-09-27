[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float v1 = 4; float v2 = 9; float v3 = 2; float v4 = 7; float v5 = 11; float v6 = 5; string info = "";
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -4.3]); addNode(g, k + "1", [x, -4.3 + v]); addEdge(g, k + "0", k + "1", 1, c); }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 22; labels = false; interactive = false }
new UI { type = slider; label = "значение x₃"; variable = v3; min = 0; max = 12; step = 0.5; default = 2 }
Update {
  float m = (v1 + v2 + v3 + v4 + v5 + v6) / 6;
  float d1 = (v1 - m) * (v1 - m); float d2 = (v2 - m) * (v2 - m); float d3 = (v3 - m) * (v3 - m);
  float d4 = (v4 - m) * (v4 - m); float d5 = (v5 - m) * (v5 - m); float d6 = (v6 - m) * (v6 - m);
  float dv = (d1 + d2 + d3 + d4 + d5 + d6) / 6;
  g = newGraph();
  bar("a", -6, d1, "#3b82f6"); bar("b", -3.6, d2, "#3b82f6"); bar("c", -1.2, d3, "#f59e0b"); bar("d", 1.2, d4, "#3b82f6"); bar("e", 3.6, d5, "#3b82f6"); bar("f", 6, d6, "#3b82f6");
  info = "Столбики — квадраты отклонений (xᵢ − x̄)² при среднем x̄ = " + format(m, 2) + ".\n\n**Выборочная дисперсия** D = среднее квадратов отклонений от среднего = (1/6)·Σ(xᵢ − x̄)² = " + format(dv, 2) + ".";
}
]
