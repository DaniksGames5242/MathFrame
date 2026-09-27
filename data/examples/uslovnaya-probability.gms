[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float pB = 0.5; float pAB = 0.2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "P(B)"; variable = pB; min = 0.1; max = 0.9; step = 0.05; default = 0.5 }
new UI { type = slider; label = "P(AB)"; variable = pAB; min = 0; max = pB; step = 0.05; default = 0.2 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -4]); addNode(g, k + "1", [x, -4 + 8 * v]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float pAgB = pAB / pB;
  g = newGraph(); bar("a", -3, pB, "#f59e0b"); bar("b", 0, pAB, "#22c55e"); bar("c", 3, pAgB, "#3b82f6");
  info = "**Условная вероятность** события A при условии, что B уже произошло: P(A|B) = P(AB) / P(B).\n\nПри P(B) = " + format(pB, 2) + " и P(AB) = " + format(pAB, 2) + " получаем P(A|B) = " + format(pAB, 2) + " / " + format(pB, 2) + " = " + format(pAgB, 3) + ".";
}
]
