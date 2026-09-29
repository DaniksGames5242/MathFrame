[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float p = 4; float ym = 6; string info = "";
new Curve { name = "par"; type = parametric; x = "ym * (2 * t - 1) * ym * (2 * t - 1) / (2 * p)"; y = "ym * (2 * t - 1)"; segments = 160; color = #3b82f6; thickness = 3 }
draw Graph { name = "gAx"; graph = "gax"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gD"; graph = "gd"; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
new Point { name = "V"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "F"; pos = (2, 0); color = #f59e0b; text = true("F"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "H"; pos = (-2, 0); dynamic = false; collision = false; text = true("D") }
new Point { name = "M"; curve = "par"; t = 0.78; text = true("M"); collideWithPoints = false; pauseOnDrag = false; layer = 60 }
new Line { name = "mf"; pos = (M, F); color = #22c55e }
new Line { name = "of"; pos = (V, F); color = #f59e0b; thickness = 4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (F.pos.x < 0.5) { F.pos.x = 0.5; }
  if (F.pos.x > 5) { F.pos.x = 5; }
  if (abs(F.pos.y) > 0.0001) { F.pos.y = 0; }
  p = 2 * F.pos.x;
  ym = min(6, sqrt(20 * p));
  gax = newGraph(); addNode(gax, "a1", [-10, 0]); addNode(gax, "a2", [10, 0]); addEdge(gax, "a1", "a2");
  gd = newGraph(); addNode(gd, "d1", [-p / 2, -6]); addNode(gd, "d2", [-p / 2, 6]); addEdge(gd, "d1", "d2");
  H.pos.x = -p / 2; H.pos.y = 0;
  float df = sqrt((M.pos.x - p / 2) * (M.pos.x - p / 2) + M.pos.y * M.pos.y);
  float dh = M.pos.x + p / 2;
  info = "**Фокус параболы** F — точка на оси симметрии внутри ветви, равноудалённая от вершины O и от директрисы (D — её пересечение с осью).\n\nПри p = " + format(p, 2) + ": F(" + format(p / 2, 2) + "; 0), |OF| = |OD| = p/2 = " + format(p / 2, 2) + ", расстояние от фокуса до директрисы |FD| = p = " + format(p, 2) + ".\n\nДля точки M(" + format(M.pos.x, 2) + "; " + num(M.pos.y, 2) + ") на параболе |MF| = " + format(df, 2) + " равно расстоянию до директрисы " + format(dh, 2) + ". Луч из фокуса после отражения от параболы идёт параллельно оси.";
}
]
