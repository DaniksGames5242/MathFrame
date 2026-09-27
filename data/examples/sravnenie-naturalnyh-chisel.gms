[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float A = 7; float B = 12; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.6); text = "A"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.6); text = "B"; size = 0.9 }
new UI { type = slider; label = "A"; variable = A; min = 0; max = 20; step = 1; default = 7 }
new UI { type = slider; label = "B"; variable = B; min = 0; max = 20; step = 1; default = 12 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 5.4 * v / 20]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  g = newGraph(); bar("a", -3, A, "#3b82f6"); bar("b", 3, B, "#f59e0b");
  string sg = "="; if (A > B) { sg = ">"; } if (A < B) { sg = "<"; }
  info = "**" + format(A, 0) + " " + sg + " " + format(B, 0) + "**: на числовой оси число, расположенное правее, всегда больше — столбик выше означает большее число.";
}
]
