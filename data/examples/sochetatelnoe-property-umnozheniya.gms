[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 2; float b = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "(a×b)×c"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "a×(b×c)"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "равны"; size = 0.9 }
new UI { type = slider; label = "число a"; variable = a; min = 1; max = 5; step = 1; default = 2 }
new UI { type = slider; label = "число b"; variable = b; min = 1; max = 5; step = 1; default = 3 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 240;
Update {
  float c = 4;
  float p1 = (a * b) * c;
  float p2 = a * (b * c);
  g = newGraph(); bar("a", -3, p1, "#3b82f6"); bar("b", 0, p2, "#f59e0b"); bar("c", 3, p1, "#22c55e");
  info = "(" + format(a, 0) + "×" + format(b, 0) + ")×4 = " + format(p1, 0) + " и " + format(a, 0) + "×(" + format(b, 0) + "×4) = " + format(p2, 0) + " — **одинаково**.";
}
]
