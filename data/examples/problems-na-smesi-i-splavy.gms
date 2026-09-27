[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float m1 = 30; float c1 = 60; float m2 = 20; string info = ""; float c2 = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "масса 1"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "масса 2"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "смесь"; size = 0.9 }
new UI { type = slider; label = "масса m₁"; variable = m1; min = 10; max = 100; step = 5; default = 30 }
new UI { type = slider; label = "концентрация c₁, %"; variable = c1; min = 10; max = 100; step = 5; default = 60 }
new UI { type = slider; label = "масса m₂"; variable = m2; min = 10; max = 100; step = 5; default = 20 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 200;
Update {
  float m = m1 + m2; c2 = (m1 * c1 / 100 + m2 * 30 / 100) / m * 100;
  g = newGraph(); bar("a", -3, m1, "#3b82f6"); bar("b", 0, m2, "#f59e0b"); bar("c", 3, m, "#22c55e");
  info = "Смесь: " + format(m1, 0) + " г (c=" + format(c1, 0) + "%) + " + format(m2, 0) + " г (c=30%). Всего **" + format(m, 0) + "** г, c = **" + format(c2, 1) + "%**.";
}
]
