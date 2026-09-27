[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float d = 5; float n = 3; string info = "";
new UI { type = slider; label = "знаменатель d"; variable = d; min = 2; max = 10; step = 1; default = 5 }
new UI { type = slider; label = "числитель n"; variable = n; min = 0; max = d - 1; step = 1; default = 3 }
draw Graph { name = "gb"; graph = "g2"; nodeRadius = 0; edgeWidth = 40; edgeCap = butt; labels = false; interactive = false; showWeights = false }
draw Text { name = "l1"; pos = (0, 3); text = format(n, 0) + "/" + format(d, 0); size = 1.1 }
Update {
  float sc = 13 / d; float i = 0; g2 = newGraph();
  repeat (10) {
    if (i < d) { addNode(g2, "p" + format(i, 0), [-6.5 + sc * i, 0]); addNode(g2, "p" + format(i + 1, 0), [-6.5 + sc * (i + 1) - 0.05, 0]);
      if (i < n) { addEdge(g2, "p" + format(i, 0), "p" + format(i + 1, 0), 1, "#3b82f6"); } if (i >= n) { addEdge(g2, "p" + format(i, 0), "p" + format(i + 1, 0)); } }
    i = i + 1;
  }
  info = "Числитель n = " + format(n, 0) + " меньше знаменателя d = " + format(d, 0) + ", поэтому дробь " + format(n, 0) + "/" + format(d, 0) + " **правильная**: закрашенная часть не покрывает всё целое, значение дроби меньше единицы.";
}
]
