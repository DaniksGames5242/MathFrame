[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float a = 4; float b = 6; float L = 12; string info = "";
new UI { type = slider; label = "a"; variable = a; min = 2; max = 15; step = 1; default = 4 }
new UI { type = slider; label = "b"; variable = b; min = 2; max = 15; step = 1; default = 6 }
draw Graph { name = "gb"; graph = "g2"; nodeRadius = 0; edgeWidth = 22; labels = false; interactive = false; showWeights = false }
Function gcdf(x, y) { float p = x; float q = y; repeat (30) { if (q > 0.5) { float r = p - q * floor(p / q); p = q; q = r; } } return p; }
Update {
  L = a * b / gcdf(a, b);
  float sc = 14 / L;
  g2 = newGraph();
  float n1 = L / a; float i2 = 0;
  repeat (30) {
    if (i2 < n1) { string c1 = "#3b82f6"; if (i2 - 2 * floor(i2 / 2) == 1) { c1 = "#22c55e"; }
      addNode(g2, "a" + format(i2, 0), [-7 + sc * a * i2, 2]); addNode(g2, "a" + format(i2 + 1, 0), [-7 + sc * a * (i2 + 1), 2]); addEdge(g2, "a" + format(i2, 0), "a" + format(i2 + 1, 0), 1, c1); }
    i2 = i2 + 1;
  }
  float n2 = L / b; i2 = 0;
  repeat (30) {
    if (i2 < n2) { string c2 = "#3b82f6"; if (i2 - 2 * floor(i2 / 2) == 1) { c2 = "#22c55e"; }
      addNode(g2, "b" + format(i2, 0), [-7 + sc * b * i2, -2]); addNode(g2, "b" + format(i2 + 1, 0), [-7 + sc * b * (i2 + 1), -2]); addEdge(g2, "b" + format(i2, 0), "b" + format(i2 + 1, 0), 1, c2); }
    i2 = i2 + 1;
  }
  info = "**Наименьшее общее кратное** a = " + format(a, 0) + " и b = " + format(b, 0) + " равно " + format(L, 0) + " — это наименьшая длина, которая делится без остатка и на a (верхний ряд блоков), и на b (нижний ряд блоков).";
}
]
