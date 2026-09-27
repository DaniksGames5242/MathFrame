[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float N = 8; float k = 0.6; string info = "";
draw Graph { name = "gd"; graph = "g"; nodeColor = #3b82f6; nodeRadius = 5; labels = false; interactive = false; edgeWidth = 0 }
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #6b7280; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
new UI { type = slider; label = "число членов n"; variable = N; min = 3; max = 14; step = 1; default = 8 }
new UI { type = slider; label = "k"; variable = k; min = -2; max = 2; step = 0.1; default = 0.6 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  gx = newGraph(); addNode(gx, "a1", [-7.5, 0]); addNode(gx, "a2", [7.5, 0]); addEdge(gx, "a1", "a2");
  float sc = 3.6 / max(abs(k) * N, 1);
  g = newGraph();
  repeat (N) { float n = i + 1; float v = k * n; addNode(g, "p" + format(n, 0), [-7.5 + 15 * (n - 1) / (N - 1), v * sc]); }
  float a1 = k * 1; float a2 = k * 2;
  string trend = "постоянна: aₙ₊₁ = aₙ при любом n"; if (k > 0) { trend = "строго возрастает: aₙ₊₁ > aₙ при любом n"; } if (k < 0) { trend = "строго убывает: aₙ₊₁ < aₙ при любом n"; }
  info = "**Последовательность aₙ = " + num(k, 1) + "·n.** Разность соседних членов aₙ₊₁ − aₙ = " + num(k, 1) + " одного знака для всех n, поэтому последовательность " + trend + ". Например, a₁ = " + num(a1, 1) + ", a₂ = " + num(a2, 1) + ".";
}
]
