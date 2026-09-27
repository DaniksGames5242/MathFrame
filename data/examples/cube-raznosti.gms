[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 4; float b = 1.5; string info = ""; float d = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 26; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.6); text = "a"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.6); text = "b"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.6); text = "a − b"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = 1; max = 6; step = 0.1; default = 4 }
new UI { type = slider; label = "b"; variable = b; min = 0.1; max = a - 0.1; step = 0.1; default = 1.5 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + v / 2]); addEdge(g, k + "0", k + "1", 1, c); }
Function num(v, d2) { if (v < 0) { return "−" + format(-v, d2); } return format(v, d2); }
Update {
  d = a - b;
  g = newGraph(); bar("a", -3, a, "#3b82f6"); bar("b", 0, b, "#f59e0b"); bar("c", 3, d, "#22c55e");
  float left = d * d * d;
  float right = a * a * a - 3 * a * a * b + 3 * a * b * b - b * b * b;
  info = "**Куб разности:** (a − b)³ = a³ − 3a²b + 3ab² − b³.\n\nПри a = " + format(a, 1) + ", b = " + format(b, 1) + ": (a − b)³ = " + num(d, 1) + "³ = " + format(left, 2) + ", и a³ − 3a²b + 3ab² − b³ = " + format(right, 2) + " — значения совпадают.";
}
]
