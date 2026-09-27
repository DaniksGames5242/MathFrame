[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float N = 12; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; interactive = false; labels = false }
new UI { type = slider; label = "число N"; variable = N; min = 2; max = 100; step = 1; default = 12 }
Function md(a, b) { return a - b * floor(a / b); }
Update {
  N = round(N);
  float d = 0; repeat (98) { float dv = i + 2; if (dv * dv <= N) { if (d == 0) { if (md(N, dv) == 0) { d = dv; } } } }
  string c = "#3b82f6"; if (d > 0) { c = "#22c55e"; }
  g = newGraph(); addNode(g, "a0", [-5, -3]); addNode(g, "a1", [-5 + 10 * N / 100, -3]); addEdge(g, "a0", "a1", 1, c);
  if (d > 0) { info = "**Составное число:** N = " + format(N, 0) + " составное — у него есть делитель " + format(d, 0) + ", отличный от 1 и N: N = " + format(d, 0) + " × " + format(N / d, 0) + "."; }
  if (d == 0) { info = "**Составное число:** N = " + format(N, 0) + " не составное — делителей, кроме 1 и себя, нет (простое число или 1)."; }
}
]
