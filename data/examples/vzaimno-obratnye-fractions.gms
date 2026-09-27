[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 2; float b = 5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "a/b"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.5); text = "b/a"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = 1; max = 8; step = 1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = 1; max = 8; step = 1; default = 5 }
Function bar(x, v, c2) { addNode(g, "n" + format(x, 0), [x, -3]); addNode(g, "m" + format(x, 0), [x, -3 + 6 * v]); addEdge(g, "n" + format(x, 0), "m" + format(x, 0), 1, c2); }
Update {
  if (a < 1) { a = 1; } if (b < 1) { b = 1; }
  float m = a; if (b > a) { m = b; }
  float v1 = (a / b) / m; float v2 = (b / a) / m;
  g = newGraph(); bar(-3, v1, "#3b82f6"); bar(3, v2, "#f59e0b");
  info = "**Взаимно обратные дроби**: " + format(a, 0) + "/" + format(b, 0) + " и её обратная " + format(b, 0) + "/" + format(a, 0) + ".\n\nИх произведение (" + format(a, 0) + "/" + format(b, 0) + ") × (" + format(b, 0) + "/" + format(a, 0) + ") = " + format((a / b) * (b / a), 2) + ".";
}
]
