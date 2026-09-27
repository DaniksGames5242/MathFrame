[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 5; float b = 10; float c = 8; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "a×(b+c)"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "a×b"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "a×c"; size = 0.9 }
new UI { type = slider; label = "число a"; variable = a; min = 1; max = 10; step = 1; default = 5 }
new UI { type = slider; label = "число b"; variable = b; min = 1; max = 20; step = 1; default = 10 }
new UI { type = slider; label = "число c"; variable = c; min = 1; max = 20; step = 1; default = 8 }
Function bar(k, x, v, c_col) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c_col); }
float VMAX = 200;
Update {
  float p1 = a * (b + c);
  float p2 = a * b;
  float p3 = a * c;
  g = newGraph(); bar("a", -3, p1, "#3b82f6"); bar("b", 0, p2, "#f59e0b"); bar("c", 3, p3, "#22c55e");
  info = format(a, 0) + "×(" + format(b, 0) + "+" + format(c, 0) + ") = " + format(p1, 0) + " = " + format(a, 0) + "×" + format(b, 0) + " + " + format(a, 0) + "×" + format(c, 0) + " = " + format(p2, 0) + " + " + format(p3, 0) + " = " + format(p1, 0) + ".";
}
]
