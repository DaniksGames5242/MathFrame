[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float a = 12; float b = 18; float key = -1; float g = 6; float L = 36; string info = "";
new UI { type = slider; label = "a"; variable = a; min = 2; max = 30; step = 1; default = 12 }
new UI { type = slider; label = "b"; variable = b; min = 2; max = 30; step = 1; default = 18 }
draw Graph { name = "gb"; graph = "g2"; nodeRadius = 0; edgeWidth = 26; edgeCap = butt; labels = false; interactive = false; showWeights = false }
draw Text { name = "ta"; pos = (-7.5, 3.1); text = "кратные a = " + format(a, 0) + ": блоков " + format(L / a, 0); size = 0.9; align = left }
draw Text { name = "tb"; pos = (-7.5, -0.9); text = "кратные b = " + format(b, 0) + ": блоков " + format(L / b, 0); size = 0.9; align = left }
draw Text { name = "tl"; pos = (7.5, -3.6); text = "НОК = " + format(L, 0); size = 0.9; align = right }
Function md(x, y) { return x - y * floor(x / y); }
Function gcdf(x, y) { float p = x; float q = y; repeat (30) { if (q > 0.5) { float r = md(p, q); p = q; q = r; } } return p; }
Update {
  if (key != a * 100 + b) {
    a = round(a); b = round(b);
    g = gcdf(a, b); L = a * b / g;
    float sc = 15 / L;
    g2 = newGraph();
    repeat (30) {
      if (i < L / a) { string c1 = "#3b82f6"; if (md(i, 2) == 1) { c1 = "#22c55e"; }
        addNode(g2, "a" + format(i, 0), [-7.5 + sc * a * i, 1.7]); addNode(g2, "a" + format(i + 1, 0), [-7.5 + sc * a * (i + 1), 1.7]); addEdge(g2, "a" + format(i, 0), "a" + format(i + 1, 0), 1, c1); }
      if (i < L / b) { string c2 = "#f59e0b"; if (md(i, 2) == 1) { c2 = "#22c55e"; }
        addNode(g2, "b" + format(i, 0), [-7.5 + sc * b * i, -2.3]); addNode(g2, "b" + format(i + 1, 0), [-7.5 + sc * b * (i + 1), -2.3]); addEdge(g2, "b" + format(i, 0), "b" + format(i + 1, 0), 1, c2); }
    }
    key = a * 100 + b;
  }
  info = "**НОД · НОК = a · b.** Верхняя полоса выложена блоками длины a = " + format(a, 0) + ", нижняя — блоками длины b = " + format(b, 0) + ". Первая длина, на которой блоки обеих полос заканчиваются одновременно, — наименьшее общее кратное: НОК = " + format(L, 0) + ".\n\nНОД(" + format(a, 0) + "; " + format(b, 0) + ") = " + format(g, 0) + ", поэтому НОК = a · b / НОД = " + format(a * b, 0) + " / " + format(g, 0) + " = **" + format(L, 0) + "**; проверка: " + format(g, 0) + " · " + format(L, 0) + " = " + format(g * L, 0) + " = " + format(a, 0) + " · " + format(b, 0) + ".";
  if (g == 1) { info = info + "\n\nЧисла взаимно просты: НОД = 1, НОК равен произведению чисел."; }
  if (md(a, b) == 0 || md(b, a) == 0) { info = info + "\n\nОдно число делится на другое: НОК — большее из них, НОД — меньшее."; }
}
]
