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
  repeat (n - 3) { addEdge(g, "0", format(i + 2, 0), 1, "#f59e0b"); }
  float s = (n - 2) * 180;
  info = "Диагонали из вершины 0 (оранжевые) разбивают n-угольник на n − 2 = " + format(n - 2, 0) + " треугольника. Сумма углов каждого равна 180°, поэтому **сумма внутренних углов** многоугольника S = (n − 2)·180° = " + format(s, 0) + "°.";
}
]
