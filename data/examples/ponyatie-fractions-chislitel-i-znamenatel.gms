[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float n = 3; float d = 4; string info = "";
new UI { type = slider; label = "знаменатель d"; variable = d; min = 2; max = 12; step = 1; default = 4 }
new UI { type = slider; label = "числитель n"; variable = n; min = 0; max = d; step = 1; default = 3 }
draw Graph { name = "gb"; graph = "g2"; nodeRadius = 0; edgeWidth = 40; edgeCap = butt; labels = false; interactive = false; showWeights = false }
draw Text { name = "l1"; pos = (0, 3); text = "n/d = " + format(n, 0) + "/" + format(d, 0); size = 1.1 }
Update {
  float sc = 13 / d; float i = 0; g2 = newGraph();
  repeat (12) {
    if (i < d) { string c = ""; if (i < n) { c = "#3b82f6"; }
      addNode(g2, "p" + format(i, 0), [-6.5 + sc * i, 0]); addNode(g2, "p" + format(i + 1, 0), [-6.5 + sc * (i + 1) - 0.05, 0]);
      if (i < n) { addEdge(g2, "p" + format(i, 0), "p" + format(i + 1, 0), 1, c); }
      if (i >= n) { addEdge(g2, "p" + format(i, 0), "p" + format(i + 1, 0)); }
    }
    i = i + 1;
  }
  info = "Целое разделено на **знаменатель** d = " + format(d, 0) + " равных частей, взято **числитель** n = " + format(n, 0) + " из них (закрашено синим). Дробь n/d = " + format(n, 0) + "/" + format(d, 0) + " показывает эту долю целого.";
}
]
