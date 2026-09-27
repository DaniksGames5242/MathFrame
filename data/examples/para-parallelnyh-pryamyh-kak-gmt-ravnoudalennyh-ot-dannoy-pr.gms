[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float d = 2; string info = "";
new Point { name = "A1"; pos = (-7, 0); dynamic = false; collision = false }
new Point { name = "A2"; pos = (7, 0); dynamic = false; collision = false }
new Line { name = "l"; pos = (A1, A2) }
new Point { name = "B1"; pos = (-7, 2); dynamic = false; collision = false }
new Point { name = "B2"; pos = (7, 2); dynamic = false; collision = false }
new Line { name = "l1"; pos = (B1, B2); color = #f59e0b }
new Point { name = "C1"; pos = (-7, -2); dynamic = false; collision = false }
new Point { name = "C2"; pos = (7, -2); dynamic = false; collision = false }
new Line { name = "l2"; pos = (C1, C2); color = #f59e0b }
new Point { name = "P"; pos = (3, 2); text = true("P"); collideWithPoints = false }
new UI { type = slider; label = "расстояние d"; variable = d; min = 0.5; max = 4.5; step = 0.1; default = 2 }
Update {
  B1.pos.y = d; B2.pos.y = d; C1.pos.y = -d; C2.pos.y = -d;
  float dist = abs(P.pos.y);
  string rel = "не принадлежит этому множеству"; if (abs(dist - d) < 0.15) { rel = "принадлежит этому множеству (лежит на одной из прямых)"; }
  info = "**Две параллельные прямые** (оранжевые) на расстоянии d от прямой l — множество точек, удалённых от l ровно на d.\n\nРасстояние от P до l = " + format(dist, 2) + ", d = " + format(d, 1) + ": точка P " + rel + ".";
}
]
