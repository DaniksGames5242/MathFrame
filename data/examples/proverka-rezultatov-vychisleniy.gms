[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 27; float b = 15; string info = "";
new UI { type = slider; label = "a"; variable = a; min = 0; max = 50; step = 1; default = 27 }
new UI { type = slider; label = "b"; variable = b; min = 0; max = 50; step = 1; default = 15 }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.6); text = "a + b"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.6); text = "c − b"; size = 0.9 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 5.4 * v / 100]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float total = a + b; float back = total - b;
  g = newGraph(); bar("a2", -3, total, "#3b82f6"); bar("b2", 3, back, "#22c55e");
  info = "**" + format(a, 0) + " + " + format(b, 0) + " = " + format(total, 0) + "**. Проверка обратным действием: " + format(total, 0) + " − " + format(b, 0) + " = **" + format(back, 0) + "** — совпадает с a, значит вычисление верно.";
}
]
