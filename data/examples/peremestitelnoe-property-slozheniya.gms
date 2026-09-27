[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 150; float b = 100; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "a + b"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "b + a"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "всегда"; size = 0.9 }
new UI { type = slider; label = "число a"; variable = a; min = 50; max = 250; step = 10; default = 150 }
new UI { type = slider; label = "число b"; variable = b; min = 50; max = 250; step = 10; default = 100 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 500;
Update {
  float s1 = a + b;
  float s2 = b + a;
  g = newGraph(); bar("a", -3, s1, "#3b82f6"); bar("b", 0, s2, "#f59e0b"); bar("c", 3, s1, "#22c55e");
  info = format(a, 0) + " + " + format(b, 0) + " = " + format(s1, 0) + " и " + format(b, 0) + " + " + format(a, 0) + " = " + format(s2, 0) + " — **равны**.";
}
]
