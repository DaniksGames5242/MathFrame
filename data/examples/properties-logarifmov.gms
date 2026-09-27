[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float x = 4; float y = 5; float b = 2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-2, -3.6); text = "logᵦx + logᵦy"; size = 0.75 }
draw Text { name = "l2"; pos = (2, -3.6); text = "logᵦ(xy)"; size = 0.85 }
new UI { type = slider; label = "x"; variable = x; min = 0.5; max = 12; step = 0.5; default = 4 }
new UI { type = slider; label = "y"; variable = y; min = 0.5; max = 12; step = 0.5; default = 5 }
new UI { type = slider; label = "основание b"; variable = b; min = 2; max = 10; step = 0.5; default = 2 }
Function bar(k, px, v, c) { addNode(g, k + "0", [px, -3]); addNode(g, k + "1", [px, -3 + 6 * v / 8]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float lb = log(b); float v1 = log(x) / lb + log(y) / lb; float v2 = log(x * y) / lb;
  g = newGraph(); bar("p", -2, v1, "#3b82f6"); bar("q", 2, v2, "#22c55e");
  info = "**Логарифм произведения:** logᵦ(xy) = logᵦx + logᵦy.\n\nПри x = " + format(x, 1) + ", y = " + format(y, 1) + ", b = " + format(b, 1) + ": logᵦx + logᵦy = " + format(v1, 3) + " и logᵦ(xy) = " + format(v2, 3) + " — столбики равны.";
}
]
