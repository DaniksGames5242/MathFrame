[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
float b1 = 2; float q = 1.5; float n = 4; string info = ""; float VMAX = 1;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 22; labels = true; interactive = false }
new UI { type = slider; label = "b₁"; variable = b1; min = -6; max = 6; step = 0.5; default = 2 }
new UI { type = slider; label = "q"; variable = q; min = -2; max = 2; step = 0.1; default = 1.5 }
new UI { type = slider; label = "n"; variable = n; min = 1; max = 10; step = 1; default = 4 }
Function num(x, dd) { if (x < 0) { return "−" + format(-x, dd); } return format(x, dd); }
Function term(k) { return b1 * pow(q, k - 1); }
Update {
  n = round(n); if (abs(q) < 0.1) { q = 0.1; }
  VMAX = 1; repeat (10) { float k = i + 1; if (k <= n) { float v = abs(term(k)); if (v > VMAX) { VMAX = v; } } }
  g = newGraph();
  repeat (10) { float k = i + 1; if (k <= n) { float x = -7 + k * 1.3; float y = 5 * term(k) / VMAX; addNode(g, "b" + k + "0", [x, 0], format(k, 0)); addNode(g, "b" + k + "1", [x, y], ""); if (k == n) { addEdge(g, "b" + k + "0", "b" + k + "1", 1, "#3b82f6"); } else { addEdge(g, "b" + k + "0", "b" + k + "1", 1); } } }
  float bn = term(n);
  info = "**bₙ = b₁·qⁿ⁻¹**. Синий столбик — искомый член. При b₁ = " + num(b1, 1) + ", q = " + num(q, 2) + ", n = " + format(n, 0) + ": bₙ = " + num(b1, 1) + " · (" + num(q, 2) + ")^" + format(n - 1, 0) + " = **" + num(bn, 2) + "**.";
}
]
