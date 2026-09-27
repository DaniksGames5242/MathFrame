[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a1 = 1; float q = 1.5; float key = -999; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; labels = false; interactive = false }
draw Graph { name = "gAx"; graph = "gx"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
new UI { type = slider; label = "первый член a₁"; variable = a1; min = 0.5; max = 3; step = 0.25; default = 1 }
new UI { type = slider; label = "знаменатель q"; variable = q; min = -2; max = 2; step = 0.1; default = 1.5 }
Function num(x, k) { if (x < 0) { return "−" + format(-x, k); } return format(x, k); }
Update {
  if (abs(q - 1) < 0.03) { q = 1.05; } if (abs(q) < 0.03) { q = 0.05; }
  if (abs(key - (a1 * 1000 + q)) > 0.001) {
    gx = newGraph(); addNode(gx, "a1", [-7.5, -4]); addNode(gx, "a2", [7.5, -4]); addEdge(gx, "a1", "a2");
    g = newGraph(); float m = 3 * abs(a1);
    repeat (8) { float n = i + 1; float v = a1 * pow(q, n - 1); float h = 8 * min(1, abs(v) / m); string c = "#3b82f6"; if (v < 0) { c = "#f59e0b"; } addNode(g, "p" + format(n, 0) + "a", [-7.5 + 15 * (n - 1) / 7, -4]); addNode(g, "p" + format(n, 0) + "b", [-7.5 + 15 * (n - 1) / 7, -4 + h]); addEdge(g, "p" + format(n, 0) + "a", "p" + format(n, 0) + "b", 1, c); }
    key = a1 * 1000 + q;
  }
  float a8 = a1 * pow(q, 7);
  string tr = "по модулю растёт неограниченно"; if (abs(q) < 1) { tr = "стремится к нулю"; }
  info = "**Геометрическая прогрессия:** aₙ = a₁ · qⁿ⁻¹. При a₁ = " + num(a1, 2) + ", q = " + num(q, 2) + " члены " + tr + (q < 0? " и меняют знак" : "") + ".\n\nВысота столбика — |aₙ| (масштаб общий), оранжевый — отрицательный член. a₈ = " + num(a8, 3) + ".";
}
]
