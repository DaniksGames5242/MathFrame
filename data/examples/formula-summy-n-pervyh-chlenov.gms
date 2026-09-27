[
description = "{info}"
field width = 18; field height = 12;
camera type = fixed;
float a1 = 2; float d = 1; float n = 5; string info = ""; float VMAX = 1;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 18; labels = true; interactive = false }
new UI { type = slider; label = "a₁"; variable = a1; min = -8; max = 8; step = 0.5; default = 2 }
new UI { type = slider; label = "d"; variable = d; min = -4; max = 4; step = 0.5; default = 1 }
new UI { type = slider; label = "n"; variable = n; min = 1; max = 10; step = 1; default = 5 }
Function num(x, dd) { if (x < 0) { return "−" + format(-x, dd); } return format(x, dd); }
Function term(k) { return a1 + d * (k - 1); }
Update {
  n = round(n);
  float an = term(n); float sn = n * (a1 + an) / 2;
  VMAX = abs(sn); repeat (10) { float k = i + 1; if (k <= n) { float v = abs(term(k)); if (v > VMAX) { VMAX = v; } } } if (VMAX < 1) { VMAX = 1; }
  g = newGraph();
  repeat (10) { float k = i + 1; if (k <= n) { float x = -8 + k * 1.0; float y = 5 * term(k) / VMAX; addNode(g, "b" + k + "0", [x, 0], format(k, 0)); addNode(g, "b" + k + "1", [x, y], ""); addEdge(g, "b" + k + "0", "b" + k + "1", 1); } }
  float sy = 5 * sn / VMAX; addNode(g, "s0", [7.5, 0], "Sₙ"); addNode(g, "s1", [7.5, sy], ""); addEdge(g, "s0", "s1", 1, "#3b82f6");
  info = "**Sₙ = n·(a₁ + aₙ)/2**. Столбики слева — члены a₁…aₙ, синий справа — их сумма. При a₁ = " + num(a1, 1) + ", d = " + num(d, 1) + ", n = " + format(n, 0) + ": aₙ = " + num(an, 1) + ", Sₙ = " + format(n, 0) + "·(" + num(a1, 1) + " + " + num(an, 1) + ")/2 = **" + num(sn, 1) + "**.";
}
]
