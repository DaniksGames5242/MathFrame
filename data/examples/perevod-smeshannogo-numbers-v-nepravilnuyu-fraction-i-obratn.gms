[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float d = 5; float w = 3; float n = 2; string info = "";
new UI { type = slider; label = "d"; variable = d; min = 2; max = 6; step = 1; default = 5 }
new UI { type = slider; label = "w"; variable = w; min = 0; max = 3; step = 1; default = 3 }
new UI { type = slider; label = "n"; variable = n; min = 0; max = d - 1; step = 1; default = 2 }
draw Graph { name = "gb"; graph = "g2"; nodeRadius = 0; edgeWidth = 22; edgeCap = butt; labels = false; interactive = false; showWeights = false }
draw Text { name = "l1"; pos = (0, 3.3); text = format(w, 0) + " целых " + format(n, 0) + "/" + format(d, 0) + " = " + format(w * d + n, 0) + "/" + format(d, 0); size = 1 }
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
  info = "**Перевод в неправильную дробь:** целую часть умножают на знаменатель и прибавляют числитель: " + format(w, 0) + " × " + format(d, 0) + " + " + format(n, 0) + " = " + format(w * d + n, 0) + ", знаменатель остаётся тем же — " + format(w * d + n, 0) + "/" + format(d, 0) + ".\n\n**Обратный перевод:** делят числитель на знаменатель с остатком — " + format(w * d + n, 0) + " ÷ " + format(d, 0) + " = " + format(w, 0) + " (остаток " + format(n, 0) + "), значит " + format(w * d + n, 0) + "/" + format(d, 0) + " = " + format(w, 0) + " целых " + format(n, 0) + "/" + format(d, 0) + ".";
}
]
