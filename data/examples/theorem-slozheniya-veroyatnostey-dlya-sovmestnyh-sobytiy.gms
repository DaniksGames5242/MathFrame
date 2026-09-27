[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float pA = 0.5; float pB = 0.4; float pAB = 0.2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; labels = false; interactive = false }
new UI { type = slider; label = "P(A)"; variable = pA; min = 0.1; max = 0.9; step = 0.05; default = 0.5 }
new UI { type = slider; label = "P(B)"; variable = pB; min = 0.1; max = 0.9; step = 0.05; default = 0.4 }
new UI { type = slider; label = "P(AB)"; variable = pAB; min = 0; max = min(pA, pB); step = 0.05; default = 0.2 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -4]); addNode(g, k + "1", [x, -4 + 8 * v]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float s = pA + pB - pAB;
  g = newGraph(); bar("a", -4.5, pA, "#3b82f6"); bar("b", -1.5, pB, "#f59e0b"); bar("c", 1.5, pAB, "#22c55e"); bar("d", 4.5, s, "#3b82f6");
  info = "**Теорема сложения вероятностей для совместных событий**: если A и B могут произойти одновременно, то P(A + B) = P(A) + P(B) − P(AB).\n\nПри P(A) = " + format(pA, 2) + ", P(B) = " + format(pB, 2) + ", P(AB) = " + format(pAB, 2) + " получаем P(A + B) = " + format(pA, 2) + " + " + format(pB, 2) + " − " + format(pAB, 2) + " = " + format(s, 2) + ".";
}
]
