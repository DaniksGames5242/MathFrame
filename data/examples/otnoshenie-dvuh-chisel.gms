[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 8; float b = 12; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "число a"; variable = a; min = 1; max = 20; step = 1; default = 8 }
new UI { type = slider; label = "число b"; variable = b; min = 1; max = 20; step = 1; default = 12 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / 20]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  g = newGraph(); bar("a", -2, a, "#3b82f6"); bar("b", 2, b, "#f59e0b");
  float d = gcd(a, b); if (d < 1) { d = 1; }
  info = "**Отношение a к b: " + format(a, 0) + " : " + format(b, 0) + " = " + format(a / d, 0) + " : " + format(b / d, 0) + "** (сократили на общий делитель " + format(d, 0) + ") = " + format(a / b, 2) + ".";
}
]
