[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float v = 60; float t = 2; string info = ""; float s = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "путь s"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "v × t"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "t, ч"; size = 0.9 }
new UI { type = slider; label = "скорость v, км/ч"; variable = v; min = 10; max = 120; step = 5; default = 60 }
new UI { type = slider; label = "время t, ч"; variable = t; min = 0.5; max = 5; step = 0.5; default = 2 }
Function bar(k, x, val, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * val / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 600;
Update {
  s = v * t;
  g = newGraph(); bar("a", -3, s, "#3b82f6"); bar("b", 0, s, "#f59e0b"); bar("c", 3, t, "#22c55e");
  info = "s = v × t = " + format(v, 0) + " × " + format(t, 1) + " = **" + format(s, 1) + " км**.";
}
]
