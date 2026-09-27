[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 8; float b = 4; float n = 2; string info = ""; float VMAX = 13;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-2.5, -3.7); text = "ⁿ√(a·b)"; size = 0.9 }
draw Text { name = "l2"; pos = (2.5, -3.7); text = "ⁿ√a · ⁿ√b"; size = 0.9 }
new UI { type = slider; label = "степень n"; variable = n; min = 2; max = 4; step = 1; default = 2 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 12; step = 0.5; default = 8 }
new UI { type = slider; label = "b"; variable = b; min = 0.5; max = 12; step = 0.5; default = 4 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float v1 = pow(a * b, 1 / n); float v2 = pow(a, 1 / n) * pow(b, 1 / n);
  g = newGraph(); bar("p", -2.5, v1, "#3b82f6"); bar("q", 2.5, v2, "#f59e0b");
  info = "При n = " + format(n, 0) + ", a = " + format(a, 1) + ", b = " + format(b, 1) + ": ⁿ√(a·b) = " + format(v1, 2) + ", ⁿ√a·ⁿ√b = " + format(v2, 2) + " — столбики равны.";
}
]
