[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 3; string info = ""; float VMAX = 3;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-2.5, -3.7); text = "1/√a"; size = 0.9 }
draw Text { name = "l2"; pos = (2.5, -3.7); text = "√a/a"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = 0.2; max = 10; step = 0.1; default = 3 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float v1 = 1 / sqrt(a); float v2 = sqrt(a) / a;
  g = newGraph(); bar("p", -2.5, v1, "#3b82f6"); bar("q", 2.5, v2, "#f59e0b");
  info = "При a = " + format(a, 1) + ": 1/√a = " + format(v1, 3) + " и √a/a = " + format(v2, 3) + " — равны при любом a > 0, но во втором знаменатель a рационален.";
}
]
