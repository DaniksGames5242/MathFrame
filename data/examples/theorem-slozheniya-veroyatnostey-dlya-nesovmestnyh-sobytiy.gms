[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float pA = 0.3; float pB = 0.4; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "P(A)"; variable = pA; min = 0.05; max = 0.95 - pB; step = 0.05; default = 0.3 }
new UI { type = slider; label = "P(B)"; variable = pB; min = 0.05; max = 0.95 - pA; step = 0.05; default = 0.4 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -4]); addNode(g, k + "1", [x, -4 + 8 * v]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float s = pA + pB;
  g = newGraph(); bar("a", -3, pA, "#3b82f6"); bar("b", 0, pB, "#f59e0b"); bar("c", 3, s, "#22c55e");
  info = "**Теорема сложения вероятностей для несовместных событий**: если события A и B не могут произойти одновременно, то P(A + B) = P(A) + P(B).\n\nПри P(A) = " + format(pA, 2) + " и P(B) = " + format(pB, 2) + " получаем P(A + B) = " + format(pA, 2) + " + " + format(pB, 2) + " = " + format(s, 2) + ".";
}
]
