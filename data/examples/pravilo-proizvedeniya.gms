[
description = "{info}"
field width = 14; field height = 8;
camera type = fixed;
float m = 3; float n = 4; string info = "";
draw Graph { name = "gG"; graph = "gg"; nodeRadius = 6; edgeWidth = 0; labels = false; interactive = false; nodeColor = #3b82f6 }
new UI { type = slider; label = "способов A: m"; variable = m; min = 1; max = 6; step = 1; default = 3 }
new UI { type = slider; label = "способов B: n"; variable = n; min = 1; max = 6; step = 1; default = 4 }
Update {
  gg = newGraph();
  repeat (m) { float xi = i; repeat (n) { addNode(gg, "p" + format(xi, 0) + "_" + format(i, 0), [-5.5 + 1.5 * xi, -3.5 + 1.4 * i]); } }
  info = "**Правило произведения**: способ A выполняется m = " + format(m, 0) + " способами, а после него, независимо от выбора A, способ B — n = " + format(n, 0) + " способами. Выполнить сначала A, потом B можно m × n = " + format(m * n, 0) + " способами — по числу точек решётки.";
}
]
