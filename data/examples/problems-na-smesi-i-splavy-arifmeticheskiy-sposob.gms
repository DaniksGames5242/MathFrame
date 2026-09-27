[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float m1 = 200; float m2 = 300; string info = ""; float result_amount = 0; float result_conc = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "раствор 1"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "раствор 2"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "смесь"; size = 0.9 }
new UI { type = slider; label = "объём раствора 1 (мл)"; variable = m1; min = 50; max = 400; step = 10; default = 200 }
new UI { type = slider; label = "объём раствора 2 (мл)"; variable = m2; min = 50; max = 400; step = 10; default = 300 }
Function bar(n, x, v, c) { addNode(g, n + "0", [x, -3]); addNode(g, n + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, n + "0", n + "1", 1, c); }
float VMAX = 500;
Update {
  result_amount = m1 + m2;
  result_conc = (80 * m1 + 20 * m2) / (m1 + m2);
  g = newGraph(); bar("m1", -3, m1, "#3b82f6"); bar("m2", 0, m2, "#f59e0b"); bar("r", 3, result_amount, "#22c55e");
  info = "Смешивание: раствор 1 (80%, " + format(m1, 0) + " мл) + раствор 2 (20%, " + format(m2, 0) + " мл) = " + format(result_amount, 0) + " мл. Концентрация смеси: **" + format(result_conc, 1) + "%**.";
}
]
