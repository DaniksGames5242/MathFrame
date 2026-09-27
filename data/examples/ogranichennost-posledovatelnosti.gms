[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float N = 10; float M = 2; string info = "";
draw Graph { name = "gd"; graph = "g"; nodeColor = #3b82f6; nodeRadius = 5; labels = false; interactive = false; edgeWidth = 0 }
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #6b7280; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
draw Graph { name = "gB"; graph = "gb"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false }
new UI { type = slider; label = "число членов n"; variable = N; min = 3; max = 20; step = 1; default = 10 }
new UI { type = slider; label = "граница M"; variable = M; min = 0.5; max = 4; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float sc = 3.6 / max(M, 1);
  gx = newGraph(); addNode(gx, "a1", [-7.5, 0]); addNode(gx, "a2", [7.5, 0]); addEdge(gx, "a1", "a2");
  gb = newGraph(); addNode(gb, "u1", [-7.5, M * sc]); addNode(gb, "u2", [7.5, M * sc]); addEdge(gb, "u1", "u2");
  addNode(gb, "d1", [-7.5, -M * sc]); addNode(gb, "d2", [7.5, -M * sc]); addEdge(gb, "d1", "d2");
  g = newGraph(); float mx = 0;
  repeat (N) { float n = i + 1; float v = M * sin(n); if (abs(v) > mx) { mx = abs(v); } addNode(g, "p" + format(n, 0), [-7.5 + 15 * (n - 1) / (N - 1), v * sc]); }
  info = "**Последовательность aₙ = " + num(M, 1) + "·sin(n)** — все члены лежат между −M и M (оранжевые границы), M = " + num(M, 1) + ". Наибольший по модулю среди показанных членов ≈ " + num(mx, 2) + " ≤ " + num(M, 1) + " — последовательность ограничена, хотя к пределу не стремится.";
}
]
