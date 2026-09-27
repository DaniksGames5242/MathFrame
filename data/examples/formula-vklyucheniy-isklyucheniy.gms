[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a = 12; float b = 9; float ii = 4; string info = "";
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -4.3]); addNode(g, k + "1", [x, -4.3 + 0.4 * v]); addEdge(g, k + "0", k + "1", 1, c); }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; labels = false; interactive = false }
new UI { type = slider; label = "|A|"; variable = a; min = 1; max = 20; step = 1; default = 12 }
new UI { type = slider; label = "|B|"; variable = b; min = 1; max = 20; step = 1; default = 9 }
new UI { type = slider; label = "|A ∩ B|"; variable = ii; min = 0; max = min(a, b); step = 1; default = 4 }
Update {
  float u = a + b - ii;
  g = newGraph();
  bar("a", -6, a, "#3b82f6"); bar("b", -2, b, "#3b82f6"); bar("c", 2, ii, "#f59e0b"); bar("d", 6, u, "#22c55e");
  info = "**Формула включений-исключений** для двух множеств: |A ∪ B| = |A| + |B| − |A ∩ B|.\n\nПри |A| = " + format(a, 0) + ", |B| = " + format(b, 0) + " и |A ∩ B| = " + format(ii, 0) + " элементы пересечения посчитаны в |A| и |B| дважды, поэтому их вычитают один раз: |A ∪ B| = " + format(a, 0) + " + " + format(b, 0) + " − " + format(ii, 0) + " = " + format(u, 0) + ".";
}
]
