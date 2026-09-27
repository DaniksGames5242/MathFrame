[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float d = 4; float n = 6; string info = "";
new UI { type = slider; label = "знаменатель d"; variable = d; min = 2; max = 8; step = 1; default = 4 }
new UI { type = slider; label = "числитель n"; variable = n; min = d; max = 2 * d; step = 1; default = 6 }
draw Graph { name = "gb"; graph = "g2"; nodeRadius = 0; edgeWidth = 26; edgeCap = butt; labels = false; interactive = false; showWeights = false }
draw Text { name = "l1"; pos = (0, 3); text = format(n, 0) + "/" + format(d, 0); size = 1.1 }
Update {
  float sc = 13 / d; float i = 0; g2 = newGraph();
  repeat (16) {
    if (i < 2 * d) { float row = 0; if (i >= d) { row = 1; }
      float x = i; if (i >= d) { x = i - d; }
      addNode(g2, "p" + format(row, 0) + "_" + format(i, 0), [-6.5 + sc * x, 1.3 - 2.6 * row]); addNode(g2, "p" + format(row, 0) + "_" + format(i + 1, 0), [-6.5 + sc * (x + 1) - 0.05, 1.3 - 2.6 * row]);
      if (i < n) { addEdge(g2, "p" + format(row, 0) + "_" + format(i, 0), "p" + format(row, 0) + "_" + format(i + 1, 0), 1, "#3b82f6"); } if (i >= n) { addEdge(g2, "p" + format(row, 0) + "_" + format(i, 0), "p" + format(row, 0) + "_" + format(i + 1, 0)); } }
    i = i + 1;
  }
  info = "Числитель n = " + format(n, 0) + " не меньше знаменателя d = " + format(d, 0) + ", поэтому дробь " + format(n, 0) + "/" + format(d, 0) + " **неправильная**: закрашенная часть покрывает целое (верхний ряд) и ещё часть второго (нижний ряд) — значение дроби не меньше единицы.";
}
]
