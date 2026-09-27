[
description = "{info}"
field width = 10; field height = 8;
camera type = fixed;
float m = 2; float n = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "степень x"; variable = m; min = 0; max = 4; step = 1; default = 2 }
new UI { type = slider; label = "степень y"; variable = n; min = 0; max = 4; step = 1; default = 3 }
Function supd(v) { if (v == 0) { return "⁰"; } if (v == 1) { return "¹"; } if (v == 2) { return "²"; } if (v == 3) { return "³"; } return "⁴"; }
Update {
  float d = m + n;
  float h = d / 8 * 6;
  g = newGraph(); addNode(g, "p0", [0, -3]); addNode(g, "p1", [0, -3 + h]); addEdge(g, "p0", "p1", 1, "#3b82f6");
  info = "**Степень одночлена** x" + supd(m) + "y" + supd(n) + " (показатели " + format(m,0) + " и " + format(n,0) + ") равна сумме показателей: " + format(m,0) + " + " + format(n,0) + " = " + format(d,0) + ".";
}
]
