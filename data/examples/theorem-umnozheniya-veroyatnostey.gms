[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float pA = 0.6; float pBgA = 0.5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "P(A)"; variable = pA; min = 0.05; max = 0.95; step = 0.05; default = 0.6 }
new UI { type = slider; label = "P(B|A)"; variable = pBgA; min = 0.05; max = 0.95; step = 0.05; default = 0.5 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -4]); addNode(g, k + "1", [x, -4 + 8 * v]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float pAB = pA * pBgA;
  g = newGraph(); bar("a", -3, pA, "#3b82f6"); bar("b", 0, pBgA, "#f59e0b"); bar("c", 3, pAB, "#22c55e");
  info = "**Теорема умножения вероятностей**: вероятность совместного появления событий A и B равна P(AB) = P(A) · P(B|A), где P(B|A) — условная вероятность B при условии A.\n\nПри P(A) = " + format(pA, 2) + " и P(B|A) = " + format(pBgA, 2) + " получаем P(AB) = " + format(pA, 2) + " × " + format(pBgA, 2) + " = " + format(pAB, 3) + ".";
}
]
