[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
float a1 = 3; float d = 2; float n = 5; string info = ""; float VMAX = 1;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 22; labels = true; interactive = false }
new UI { type = slider; label = "a₁"; variable = a1; min = -10; max = 10; step = 1; default = 3 }
new UI { type = slider; label = "d"; variable = d; min = -5; max = 5; step = 0.5; default = 2 }
new UI { type = slider; label = "n"; variable = n; min = 1; max = 10; step = 1; default = 5 }
Function num(x, dd) { if (x < 0) { return "−" + format(-x, dd); } return format(x, dd); }
Function term(k) { return a1 + d * (k - 1); }
Update {
  n = round(n);
  VMAX = 1; repeat (10) { float k = i + 1; if (k <= n) { float v = abs(term(k)); if (v > VMAX) { VMAX = v; } } }
  g = newGraph();
  repeat (10) { float k = i + 1; if (k <= n) { float x = -7 + k * 1.3; float y = 5 * term(k) / VMAX; addNode(g, "b" + k + "0", [x, 0], format(k, 0)); addNode(g, "b" + k + "1", [x, y], ""); if (k == n) { addEdge(g, "b" + k + "0", "b" + k + "1", 1, "#3b82f6"); } else { addEdge(g, "b" + k + "0", "b" + k + "1", 1); } } }
  float an = term(n);
  info = "**aₙ = a₁ + d(n − 1)**. Синий столбик — искомый член. При a₁ = " + num(a1, 0) + ", d = " + num(d, 1) + ", n = " + format(n, 0) + ": aₙ = " + num(a1, 0) + " + (" + num(d, 1) + ")·(" + format(n, 0) + " − 1) = **" + num(an, 1) + "**.";
}
]
