[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float amount = 300; float k = 2; string info = ""; float v50 = 0; float v10 = 0; float v1 = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "50₽"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "10₽"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "1₽"; size = 0.9 }
new UI { type = slider; label = "сумма (рубли)"; variable = amount; min = 50; max = 500; step = 10; default = 300 }
new UI { type = slider; label = "отношение купюр"; variable = k; min = 1; max = 5; step = 0.5; default = 2 }
Function bar(n, x, v, c) { addNode(g, n + "0", [x, -3]); addNode(g, n + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, n + "0", n + "1", 1, c); }
float VMAX = 300;
Update {
  v50 = amount * k / (k + 1 + 0.1);
  v10 = amount * 1 / (k + 1 + 0.1);
  v1 = amount * 0.1 / (k + 1 + 0.1);
  g = newGraph(); bar("v50", -3, v50, "#3b82f6"); bar("v10", 0, v10, "#f59e0b"); bar("v1", 3, v1, "#22c55e");
  info = "Размен " + format(amount, 0) + " рублей в отношении купюр " + format(k, 1) + ":1:0,1. Примерное распределение: " + format(v50, 0) + "₽ (50-рублёвые) + " + format(v10, 0) + "₽ (10-рублёвые) + " + format(v1, 0) + "₽ (1-рублёвые) = **" + format(v50 + v10 + v1, 0) + "₽**.";
}
]
