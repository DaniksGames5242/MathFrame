[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 2; float b = 1; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "(a+b)²"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "(a+b)³"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "(a+b)⁴"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 2; step = 0.1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = 0.5; max = 1.5; step = 0.1; default = 1 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 100;
Update {
  float sq = (a + b) * (a + b); float cb = sq * (a + b); float f4 = cb * (a + b);
  g = newGraph(); bar("a", -3, sq, "#3b82f6"); bar("b", 0, cb, "#f59e0b"); bar("c", 3, f4, "#22c55e");
  info = "Бином Ньютона: **(a + b)ⁿ** при a = " + format(a, 1) + ", b = " + format(b, 1) + ": (a + b)² = " + format(sq, 1) + ", (a + b)³ = " + format(cb, 1) + ", (a + b)⁴ = " + format(f4, 1) + ".";
}
]
