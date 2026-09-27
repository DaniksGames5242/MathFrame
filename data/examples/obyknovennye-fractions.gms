[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float n = 6; float d = 8; string info = "";
new UI { type = slider; label = "знаменатель d"; variable = d; min = 2; max = 12; step = 1; default = 8 }
new UI { type = slider; label = "числитель n"; variable = n; min = 0; max = d; step = 1; default = 6 }
draw Graph { name = "gb"; graph = "g2"; nodeRadius = 0; edgeWidth = 40; edgeCap = butt; labels = false; interactive = false; showWeights = false }
draw Text { name = "l1"; pos = (0, 3); text = format(n, 0) + "/" + format(d, 0); size = 1.1 }
Function gcdf(x, y) { float p = x; float q = y; repeat (20) { if (q > 0.5) { float r = p - q * floor(p / q); p = q; q = r; } } return p; }
Update {
  float sc = 13 / d; float i = 0; g2 = newGraph();
  repeat (12) {
    if (i < d) { addNode(g2, "p" + format(i, 0), [-6.5 + sc * i, 0]); addNode(g2, "p" + format(i + 1, 0), [-6.5 + sc * (i + 1) - 0.05, 0]);
      if (i < n) { addEdge(g2, "p" + format(i, 0), "p" + format(i + 1, 0), 1, "#3b82f6"); } if (i >= n) { addEdge(g2, "p" + format(i, 0), "p" + format(i + 1, 0)); } }
    i = i + 1;
  }
  float g = 1; if (n > 0.5) { g = gcdf(n, d); }
  string tail = " — дробь несократима.";
  if (g > 1.5) { tail = ", сократимая на " + format(g, 0) + ": равна " + format(n / g, 0) + "/" + format(d / g, 0) + "."; }
  info = "Дробь " + format(n, 0) + "/" + format(d, 0) + " показывает закрашенную долю целого" + tail + " Значение дроби не меняется при умножении и делении числителя и знаменателя на одно и то же число.";
}
]
