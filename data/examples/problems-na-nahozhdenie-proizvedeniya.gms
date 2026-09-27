[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float n = 4; float m = 5; string info = ""; float prod = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "шт/ряд"; size = 0.85 }
draw Text { name = "l2"; pos = (0, -3.5); text = "рядов"; size = 0.85 }
draw Text { name = "l3"; pos = (3, -3.5); text = "всего"; size = 0.85 }
new UI { type = slider; label = "предметов в ряду"; variable = n; min = 2; max = 8; step = 1; default = 4 }
new UI { type = slider; label = "число рядов"; variable = m; min = 2; max = 8; step = 1; default = 5 }
Function bar(k, x_pos, v, c) { addNode(g, k + "0", [x_pos, -3]); addNode(g, k + "1", [x_pos, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 64;
Update {
  prod = n * m;
  g = newGraph(); bar("a", -3, n, "#3b82f6"); bar("b", 0, m, "#f59e0b"); bar("c", 3, prod, "#22c55e");
  info = "Задача на произведение: " + format(n, 0) + " × " + format(m, 0) + " = **" + format(prod, 0) + "** предметов.";
}
]
