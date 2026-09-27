[
description = "{info}"
field width = 14; field height = 8;
camera type = fixed;
float a = 2; float b = 3; float x0 = 3; float y0 = 2; string info = ""; float g = 0;
Function bar(name, px, v, c) { addNode(g, name + "0", [px, -3]); addNode(g, name + "1", [px, -3 + v]); addEdge(g, name + "0", name + "1", 1, c); }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; labels = false; interactive = false }
new UI { type = slider; label = "a"; variable = a; min = 1; max = 5; step = 1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = 1; max = 5; step = 1; default = 3 }
Update {
  g = newGraph(); bar("ax", -5, a * x0 / 3, "#3b82f6"); bar("ay", -1.5, a * y0 / 3, "#3b82f6"); bar("bx", 1.5, b * x0 / 3, "#f59e0b"); bar("by", 5, b * y0 / 3, "#f59e0b");
  info = "**ax + ay + bx + by** при a = " + format(a, 0) + ", b = " + format(b, 0) + ", x = " + format(x0, 0) + ", y = " + format(y0, 0) + ".\n\nСиние члены (ax, ay) объединяются в группу a(x + y), оранжевые (bx, by) — в группу b(x + y): a(x + y) + b(x + y) = (a + b)(x + y).";
}
]
