[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float d = 4; float w = 2; float n = 1; string info = "";
new UI { type = slider; label = "d"; variable = d; min = 2; max = 6; step = 1; default = 4 }
new UI { type = slider; label = "w"; variable = w; min = 0; max = 3; step = 1; default = 2 }
new UI { type = slider; label = "n"; variable = n; min = 0; max = d - 1; step = 1; default = 1 }
draw Graph { name = "gb"; graph = "g2"; nodeRadius = 0; edgeWidth = 26; edgeCap = butt; labels = false; interactive = false; showWeights = false }
draw Text { name = "l1"; pos = (0, 3.3); text = format(w, 0) + " целых " + format(n, 0) + "/" + format(d, 0); size = 1 }
Update {
  float sc = 14 / ((w + 1) * d); float i = 0; float row = 0; g2 = newGraph();
  repeat (4) {
    if (row < w + 1) { i = 0;
      repeat (6) {
        if (i < d) { float full = row < w; float part = (row == w) && (i < n);
          if (full || part) {
            addNode(g2, "p" + format(row, 0) + "_" + format(i, 0), [-7 + sc * (d * row + i), 0]); addNode(g2, "p" + format(row, 0) + "_" + format(i + 1, 0), [-7 + sc * (d * row + i + 1) - 0.05, 0]);
            addEdge(g2, "p" + format(row, 0) + "_" + format(i, 0), "p" + format(row, 0) + "_" + format(i + 1, 0), 1, "#3b82f6");
          }
        }
        i = i + 1;
      }
      row = row + 1;
    }
  }
  info = "**Смешанное число** — целая часть w = " + format(w, 0) + " и правильная дробь n/d = " + format(n, 0) + "/" + format(d, 0) + ": " + format(w, 0) + " целых блоков (по d частей) плюс ещё " + format(n, 0) + " частей из d. Значение равно " + format(w, 0) + " целых " + format(n, 0) + "/" + format(d, 0) + ".";
}
]
