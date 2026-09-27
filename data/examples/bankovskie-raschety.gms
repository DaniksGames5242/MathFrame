[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float K = 100; float r = 5; string info = ""; float I = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "капитал"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "ставка %"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "доход"; size = 0.9 }
new UI { type = slider; label = "капитал K"; variable = K; min = 50; max = 500; step = 10; default = 100 }
new UI { type = slider; label = "ставка r"; variable = r; min = 1; max = 20; step = 0.5; default = 5 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 500;
Update {
  I = K * r / 100;
  g = newGraph(); bar("a", -3, K, "#3b82f6"); bar("b", 0, r * 10, "#f59e0b"); bar("c", 3, I, "#22c55e");
  info = "Простой процент: I = " + format(K, 0) + " × " + format(r, 1) + "/100 = **" + format(I, 1) + "** за год.";
}
]
