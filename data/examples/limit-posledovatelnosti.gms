[
description = "{info}"
field width = 20; field height = 10;
camera type = fixed;
float n = 15; string info = "";
draw Graph { name = "gAx"; graph = "gx"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
draw Graph { name = "gp"; graph = "g"; nodeRadius = 5; edgeWidth = 0; labels = false; interactive = false; color = #3b82f6 }
new UI { type = slider; label = "число членов n"; variable = n; min = 3; max = 40; step = 1; default = 15 }
Update {
  g = newGraph(); gx = newGraph();
  addNode(gx, "z1", [-9, 0]); addNode(gx, "z2", [9, 0]); addEdge(gx, "z1", "z2");
  float step = 17.6 / n;
  repeat (n) { float k = i + 1; float v = 1 / k; addNode(g, "p" + format(k,0), [-8.8 + step*(k-0.5), 4.5*v]); }
  float an = 1 / n;
  info = "**Предел последовательности:** aₙ = 1/n при n → ∞ стремится к пределу L = 0 — члены последовательности всё теснее приближаются к прямой y = 0 (серая линия).\n\nПри n = " + format(n,0) + ": aₙ = " + format(an,4) + ".";
}
]
