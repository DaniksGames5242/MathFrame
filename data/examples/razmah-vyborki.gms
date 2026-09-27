[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float v1 = 4; float v2 = 9; float v3 = 2; float v4 = 7; float v5 = 11; float v6 = 5; string info = "";
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -4.3]); addNode(g, k + "1", [x, -4.3 + 0.6 * v]); addEdge(g, k + "0", k + "1", 1, c); }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 22; labels = false; interactive = false }
new UI { type = slider; label = "значение x₃"; variable = v3; min = 0; max = 12; step = 0.5; default = 2 }
Update {
  float mn = min(min(min(v1, v2), min(v3, v4)), min(v5, v6));
  float mx = max(max(max(v1, v2), max(v3, v4)), max(v5, v6));
  g = newGraph();
  bar("a", -6, v1, "#3b82f6"); bar("b", -3.6, v2, "#3b82f6"); bar("c", -1.2, v3, "#f59e0b"); bar("d", 1.2, v4, "#3b82f6"); bar("e", 3.6, v5, "#3b82f6"); bar("f", 6, v6, "#3b82f6");
  info = "**Выборка:** " + format(v1, 1) + "; " + format(v2, 1) + "; " + format(v3, 1) + "; " + format(v4, 1) + "; " + format(v5, 1) + "; " + format(v6, 1) + ".\n\n**Размах выборки** R = xₘₐₓ − xₘᵢₙ = " + format(mx, 1) + " − " + format(mn, 1) + " = " + format(mx - mn, 1) + " — разница между наибольшим и наименьшим значением выборки.";
}
]
