[
description = "{info}"
field width = 12; field height = 12;
camera type = fixed;
float n = 5; string info = ""; float g = 0;
Function ang(k) { return pi / 2 + 2 * pi * k / n; }
new UI { type = slider; label = "число сторон n"; variable = n; min = 3; max = 10; step = 1; default = 5 }
draw Graph { name = "gr"; graph = "g"; nodeRadius = 5; labels = false }
Update {
  n = round(n);
  g = newGraph();
  repeat (n) { addNode(g, format(i, 0), [4.5 * cos(ang(i)), 4.5 * sin(ang(i))]); }
  repeat (n) { float j = i + 1; if (j >= n) { j = 0; } addEdge(g, format(i, 0), format(j, 0)); }
  float ext = 360 / n;
  float inn = 180 - ext;
  info = "При обходе правильного n-угольника направление движения поворачивается на внешний угол в каждой вершине, а всего — на полный оборот: **сумма внешних углов** = 360° при любом n = " + format(n, 0) + ".\n\nПоэтому каждый внешний угол = 360°/n = " + format(ext, 1) + "°, а внутренний = 180° − " + format(ext, 1) + "° = " + format(inn, 1) + "°.";
}
]
