[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float h = 3; float t = 2; string info = ""; float r = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "h×10²"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "t×10¹"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "единицы"; size = 0.9 }
new UI { type = slider; label = "сотни h"; variable = h; min = 1; max = 9; step = 1; default = 3 }
new UI { type = slider; label = "десятки t"; variable = t; min = 0; max = 9; step = 1; default = 2 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 900;
Update {
  r = h * 100 + t * 10 + 5;
  g = newGraph(); bar("a", -3, h * 100, "#3b82f6"); bar("b", 0, t * 10, "#f59e0b"); bar("c", 3, 5, "#22c55e");
  info = format(h, 0) + format(t, 0) + "5 = " + format(h, 0) + "×10² " + format(t, 0) + "×10¹ 5×10⁰ = " + format(h * 100, 0) + " " + format(t * 10, 0) + " 5.";
}
]
