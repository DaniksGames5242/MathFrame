[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 3; float b = 2; string info = ""; float VMAX = 15;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-2.5, -3.7); text = "a·√b"; size = 0.9 }
draw Text { name = "l2"; pos = (2.5, -3.7); text = "√(a²·b)"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 6; step = 0.1; default = 3 }
new UI { type = slider; label = "b"; variable = b; min = 0.5; max = 6; step = 0.1; default = 2 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float v1 = a * sqrt(b); float v2 = sqrt(a * a * b);
  g = newGraph(); bar("p", -2.5, v1, "#3b82f6"); bar("q", 2.5, v2, "#f59e0b");
  info = "При a = " + format(a, 1) + " ≥ 0, b = " + format(b, 1) + ": a·√b = " + format(v1, 2) + ", √(a²·b) = " + format(v2, 2) + " — столбики равны, множитель внесён под корень: a√b = √(a²b).";
}
]
