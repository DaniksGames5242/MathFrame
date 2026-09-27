[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a1 = 1; float d = 1; float key = -999; string info = "";
draw Graph { name = "gd"; graph = "g"; nodeColor = #3b82f6; edgeColor = #3b82f6; nodeRadius = 4; edgeWidth = 2; labels = false; interactive = false }
draw Graph { name = "gAx"; graph = "gx"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
new UI { type = slider; label = "первый член a₁"; variable = a1; min = -5; max = 5; step = 0.5; default = 1 }
new UI { type = slider; label = "разность d"; variable = d; min = -3; max = 3; step = 0.25; default = 1 }
Function num(x, k) { if (x < 0) { return "−" + format(-x, k); } return format(x, k); }
Update {
  if (abs(key - (a1 * 100 + d)) > 0.001) {
    gx = newGraph(); addNode(gx, "a1", [-7.5, 0]); addNode(gx, "a2", [7.5, 0]); addEdge(gx, "a1", "a2");
    g = newGraph();
    float amax = 0; repeat (10) { float n = i + 1; amax = max(amax, abs(a1 + (n - 1) * d)); }
    float sy = 4 / max(1, amax);
    repeat (10) { float n = i + 1; float v = a1 + (n - 1) * d; addNode(g, "p" + format(n, 0), [-7.5 + 15 * (n - 1) / 9, v * sy]); if (i > 0) { addEdge(g, "p" + format(n - 1, 0), "p" + format(n, 0)); } }
    key = a1 * 100 + d;
  }
  float a10 = a1 + 9 * d;
  string tr = "возрастает"; if (d < 0) { tr = "убывает"; } if (abs(d) < 0.01) { tr = "постоянна"; }
  info = "**Арифметическая прогрессия:** aₙ = a₁ + (n − 1)d. При a₁ = " + num(a1, 1) + ", d = " + num(d, 2) + " прогрессия " + tr + ".\n\nПоказаны члены a₁ … a₁₀, точки лежат на одной прямой. a₁₀ = " + num(a10, 2) + ".";
}
]
