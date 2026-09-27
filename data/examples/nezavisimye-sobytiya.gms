[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float pA = 0.5; float pB = 0.4; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "P(A)"; variable = pA; min = 0.05; max = 0.95; step = 0.05; default = 0.5 }
new UI { type = slider; label = "P(B)"; variable = pB; min = 0.05; max = 0.95; step = 0.05; default = 0.4 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -4]); addNode(g, k + "1", [x, -4 + 8 * v]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float pAB = pA * pB;
  g = newGraph(); bar("a", -3, pA, "#3b82f6"); bar("b", 0, pB, "#f59e0b"); bar("c", 3, pAB, "#22c55e");
  info = "**Независимые события**: A и B независимы, если появление одного не меняет вероятность другого. Для них P(AB) = P(A) · P(B).\n\nПри P(A) = " + format(pA, 2) + " и P(B) = " + format(pB, 2) + " получаем P(AB) = " + format(pA, 2) + " × " + format(pB, 2) + " = " + format(pAB, 3) + ".";
}
]
