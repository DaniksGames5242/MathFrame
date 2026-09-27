[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 2; float m = -2; float n = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; labels = false; interactive = false }
Function power(a, k) { if (k == 0) { return 1; } if (k > 0) { return pow(a, k); } return 1 / pow(a, -k); }
new UI { type = slider; label = "основание a"; variable = a; min = 0.5; max = 2.5; step = 0.1; default = 2 }
new UI { type = slider; label = "показатель m"; variable = m; min = -4; max = 4; step = 1; default = -2 }
new UI { type = slider; label = "показатель n"; variable = n; min = -4; max = 4; step = 1; default = 3 }
Update {
  float lhs = power(a, m) * power(a, n); float rhs = power(a, m + n);
  float lb = lhs; if (lb > 8) { lb = 8; } float rb = rhs; if (rb > 8) { rb = 8; }
  g = newGraph(); addNode(g, "a0", [-2, -3]); addNode(g, "a1", [-2, -3 + 6 * lb / 8]); addEdge(g, "a0", "a1", 1, "#3b82f6");
  addNode(g, "b0", [2, -3]); addNode(g, "b1", [2, -3 + 6 * rb / 8]); addEdge(g, "b0", "b1", 1, "#f59e0b");
  info = "**Свойства степени с целым показателем:** a в степени m, умноженное на a в степени n, равно a в степени (m + n), при a ≠ 0.\n\nПри a = " + format(a, 1) + ", m = " + format(m, 0) + ", n = " + format(n, 0) + ": левая часть = " + format(lhs, 3) + " (синий), правая часть = " + format(rhs, 3) + " (оранжевый) — совпадают.";
}
]
