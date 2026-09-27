[
description = "{info}"
field width = 18; field height = 12;
camera type = fixed;
float b1 = 1; float q = 1.3; float n = 5; string info = ""; float VMAX = 1;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 18; labels = true; interactive = false }
new UI { type = slider; label = "b₁"; variable = b1; min = -5; max = 5; step = 0.5; default = 1 }
new UI { type = slider; label = "q"; variable = q; min = -2; max = 2; step = 0.1; default = 1.3 }
new UI { type = slider; label = "n"; variable = n; min = 1; max = 10; step = 1; default = 5 }
Function num(x, dd) { if (x < 0) { return "−" + format(-x, dd); } return format(x, dd); }
Function term(k) { return b1 * pow(q, k - 1); }
Update {
  n = round(n); if (abs(q - 1) < 0.05) { q = 1.05; }
  float sn = b1 * (1 - pow(q, n)) / (1 - q);
  VMAX = abs(sn); repeat (10) { float k = i + 1; if (k <= n) { float v = abs(term(k)); if (v > VMAX) { VMAX = v; } } } if (VMAX < 1) { VMAX = 1; }
  g = newGraph();
  repeat (10) { float k = i + 1; if (k <= n) { float x = -8 + k * 1.0; float y = 5 * term(k) / VMAX; addNode(g, "b" + k + "0", [x, 0], format(k, 0)); addNode(g, "b" + k + "1", [x, y], ""); addEdge(g, "b" + k + "0", "b" + k + "1", 1); } }
  float sy = 5 * sn / VMAX; addNode(g, "s0", [7.5, 0], "Sₙ"); addNode(g, "s1", [7.5, sy], ""); addEdge(g, "s0", "s1", 1, "#3b82f6");
  info = "**Sₙ = b₁(1 − qⁿ)/(1 − q)**. Столбики слева — члены b₁…bₙ, синий справа — их сумма. При b₁ = " + num(b1, 1) + ", q = " + num(q, 2) + ", n = " + format(n, 0) + ": Sₙ = **" + num(sn, 2) + "**.";
}
]
