[
description = "{info}"
field width = 14; field height = 8;
camera type = fixed;
float m = 3; float n = 4; string info = "";
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 7; edgeWidth = 0; labels = false; interactive = false; nodeColor = #3b82f6 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 7; edgeWidth = 0; labels = false; interactive = false; nodeColor = #f59e0b }
new UI { type = slider; label = "способов A: m"; variable = m; min = 1; max = 8; step = 1; default = 3 }
new UI { type = slider; label = "способов B: n"; variable = n; min = 1; max = 8; step = 1; default = 4 }
Update {
  ga = newGraph(); repeat (m) { addNode(ga, "a" + format(i, 0), [-6.4 + 0.9 * i, 2]); }
  gb = newGraph(); repeat (n) { addNode(gb, "b" + format(i, 0), [-6.4 + 0.9 * i, -2]); }
  info = "**Правило суммы**: способ A выполняется m = " + format(m, 0) + " способами (синие точки), способ B — n = " + format(n, 0) + " способами (оранжевые), и эти способы не пересекаются. Тогда выбрать A или B можно m + n = " + format(m + n, 0) + " способами.";
}
]
