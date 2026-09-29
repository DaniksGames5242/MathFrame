[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float p = 2; float ym = 6; string info = "";
new Curve { name = "par"; type = parametric; x = "ym * (2 * t - 1) * ym * (2 * t - 1) / (2 * p)"; y = "ym * (2 * t - 1)"; segments = 160; color = #3b82f6; thickness = 3 }
draw Graph { name = "gAx"; graph = "gax"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
new Point { name = "V"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "F"; pos = (1, 0); dynamic = false; collision = false; color = #f59e0b; text = true("F") }
new Point { name = "H"; pos = (-1, 0); dynamic = false; collision = false; text = true("H") }
new Point { name = "M"; curve = "par"; t = 0.75; text = true("M"); pauseOnDrag = false; layer = 60 }
new Line { name = "mf"; pos = (M, F); color = #22c55e }
new Line { name = "mh"; pos = (M, H); color = #22c55e }
new UI { type = slider; label = "параметр p"; variable = p; min = 1; max = 6; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  ym = min(6, sqrt(20 * p));
  gax = newGraph(); addNode(gax, "a1", [-10, 0]); addNode(gax, "a2", [10, 0]); addEdge(gax, "a1", "a2");
  gd = newGraph(); addNode(gd, "d1", [-p / 2, -6]); addNode(gd, "d2", [-p / 2, 6]); addEdge(gd, "d1", "d2");
  F.pos.x = p / 2; F.pos.y = 0;
  H.pos.x = -p / 2; H.pos.y = M.pos.y;
  float df = sqrt((M.pos.x - p / 2) * (M.pos.x - p / 2) + M.pos.y * M.pos.y);
  float dh = M.pos.x + p / 2;
  info = "**Парабола** y² = 2px при p = " + format(p, 1) + ": вершина O(0; 0) — начало координат, ось симметрии — ось абсцисс, фокус F(" + format(p / 2, 2) + "; 0), директриса x = −" + format(p / 2, 2) + " (оранжевая).\n\nДля точки M(" + format(M.pos.x, 2) + "; " + num(M.pos.y, 2) + ") на кривой: |MF| = " + format(df, 2) + ", расстояние до директрисы |MH| = " + format(dh, 2) + " — они равны. Любая прямая, параллельная оси, пересекает параболу ровно в одной точке.";
}
]
