[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float t1 = 12; float t2 = 18; string info = ""; float t_combined = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "t₁"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "t₂"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "t_общ"; size = 0.9 }
new UI { type = slider; label = "время работника 1 (дни)"; variable = t1; min = 2; max = 20; step = 1; default = 12 }
new UI { type = slider; label = "время работника 2 (дни)"; variable = t2; min = 2; max = 20; step = 1; default = 18 }
Function bar(n, x, v, c) { addNode(g, n + "0", [x, -3]); addNode(g, n + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, n + "0", n + "1", 1, c); }
float VMAX = 20;
Update {
  t_combined = 1 / (1 / t1 + 1 / t2);
  g = newGraph(); bar("t1", -3, t1, "#3b82f6"); bar("t2", 0, t2, "#f59e0b"); bar("tc", 3, t_combined, "#22c55e");
  info = "Совместная работа. Работник 1 выполняет работу за " + format(t1, 0) + " дней, работник 2 — за " + format(t2, 0) + " дней. Вместе: 1/(" + format(t1, 0) + ") + 1/(" + format(t2, 0) + ") = 1/(**" + format(t_combined, 2) + "**), то есть **" + format(t_combined, 1) + "** дней.";
}
]
