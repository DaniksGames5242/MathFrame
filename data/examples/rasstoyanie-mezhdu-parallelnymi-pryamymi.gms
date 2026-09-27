[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float h = 3; string info = "";
new Point { name = "A1"; pos = (-7, 0); dynamic = false; collision = false }
new Point { name = "B1"; pos = (7, 0); dynamic = false; collision = false }
new Line { name = "l1"; pos = (A1, B1) }
new Point { name = "A2"; pos = (-7, 3); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "B2"; pos = (7, 3); dynamic = false; collision = false; color = #3b82f6 }
new Line { name = "l2"; pos = (A2, B2); color = #3b82f6 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "Q"; pos = (0, 3); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "pq"; pos = (P, Q); color = #f59e0b }
new UI { type = slider; label = "расстояние h"; variable = h; min = 1; max = 4.5; step = 0.1; default = 3 }
Update {
  A2.pos.y = h; B2.pos.y = h; Q.pos.y = h;
  info = "**Расстояние между параллельными прямыми** — длина перпендикулярного отрезка PQ между ними: она не зависит от выбора точки на прямой.\n\nPQ = " + format(h, 1) + ". Любой другой отрезок, соединяющий эти прямые, длиннее PQ.";
}
]
