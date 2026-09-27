[
description = "{info}"
field width = 14; field height = 12;
camera type = fixed;
float n = 6; string info = "";
draw Graph { name = "gp"; graph = "g"; nodeRadius = 0; edgeWidth = 3; labels = false; interactive = false }
new UI { type = slider; label = "число сторон n"; variable = n; min = 3; max = 12; step = 1; default = 6 }
Update {
  g = newGraph();
  float k = 0;
  repeat (12) {
    if (k < n) {
      float ang = 6.2832 * k / n - 1.5708;
      addNode(g, "p" + format(k, 0), [4.5 * cos(ang), 4.5 * sin(ang)]);
    }
    k = k + 1;
  }
  k = 0;
  repeat (12) {
    if (k < n) {
      float nx = k + 1; if (nx >= n) { nx = 0; }
      addEdge(g, "p" + format(k, 0), "p" + format(nx, 0));
    }
    k = k + 1;
  }
  float sum = 180 * (n - 2);
  info = "**Многоугольник** — замкнутая ломаная без самопересечений, у соседних звеньев которой нет общего направления. При n = " + format(n, 0) + " сторонах у него " + format(n, 0) + " вершин, а сумма внутренних углов равна 180°·(n − 2) = " + format(sum, 0) + "°.";
}
]
