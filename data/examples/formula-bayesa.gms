[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float p1 = 0.4; float q1 = 0.3; float q2 = 0.7; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; labels = false; interactive = false }
new UI { type = slider; label = "H1"; variable = p1; min = 0.05; max = 0.95; step = 0.05; default = 0.4 }
new UI { type = slider; label = "A|H1"; variable = q1; min = 0.05; max = 0.95; step = 0.05; default = 0.3 }
new UI { type = slider; label = "A|H2"; variable = q2; min = 0.05; max = 0.95; step = 0.05; default = 0.7 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -4]); addNode(g, k + "1", [x, -4 + 8 * v]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float p2 = 1 - p1;
  float pA = p1 * q1 + p2 * q2;
  float pH1A = p1 * q1 / pA;
  g = newGraph(); bar("a", -3, p1, "#f59e0b"); bar("b", 0, pA, "#22c55e"); bar("c", 3, pH1A, "#3b82f6");
  info = "**Формула Байеса**: по известному результату опыта (событие A произошло) переоценивают вероятность гипотезы H1: P(H1|A) = P(H1)·P(A|H1) / P(A).\n\nПри P(H1) = " + format(p1, 2) + " априорная, а после того как A произошло, P(H1|A) = " + format(p1 * q1, 3) + " / " + format(pA, 3) + " = " + format(pH1A, 3) + ".";
}
]
