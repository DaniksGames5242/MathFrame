[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float d = -2; float p = 4; float v = 0; float ym = 6; string info = "";
new Curve { name = "par"; type = parametric; x = "v + ym * (2 * t - 1) * ym * (2 * t - 1) / (2 * p)"; y = "ym * (2 * t - 1)"; segments = 160; color = #3b82f6; thickness = 3 }
draw Graph { name = "gAx"; graph = "gax"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
new Point { name = "F"; pos = (2, 0); dynamic = false; collision = false; text = true("F") }
new Point { name = "D"; pos = (-2, 0); color = #f59e0b; text = true("D"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "H"; pos = (-2, 3); dynamic = false; collision = false; text = true("H") }
new Point { name = "M"; curve = "par"; t = 0.78; text = true("M"); collideWithPoints = false; pauseOnDrag = false; layer = 60 }
new Line { name = "mf"; pos = (M, F); color = #22c55e }
new Line { name = "mh"; pos = (M, H); color = #22c55e }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (D.pos.x < -6) { D.pos.x = -6; }
  if (D.pos.x > 1.5) { D.pos.x = 1.5; }
  if (abs(D.pos.y) > 0.0001) { D.pos.y = 0; }
  d = D.pos.x; p = 2 - d; v = (2 + d) / 2;
  ym = min(6, sqrt(2 * p * (10 - v)));
  gax = newGraph(); addNode(gax, "a1", [-10, 0]); addNode(gax, "a2", [10, 0]); addEdge(gax, "a1", "a2");
  gd = newGraph(); addNode(gd, "d1", [d, -6]); addNode(gd, "d2", [d, 6]); addEdge(gd, "d1", "d2");
  H.pos.x = d; H.pos.y = M.pos.y;
  float df = sqrt((M.pos.x - 2) * (M.pos.x - 2) + M.pos.y * M.pos.y);
  float dh = M.pos.x - d;
  info = "**Директриса параболы** — прямая, перпендикулярная оси симметрии, по другую сторону от вершины, чем фокус, и на том же расстоянии от неё. Здесь фокус F(2; 0), директриса x = " + num(d, 2) + " (оранжевая), расстояние от фокуса до директрисы p = " + format(p, 2) + ", вершина (" + num(v, 2) + "; 0).\n\nДля точки M(" + format(M.pos.x, 2) + "; " + num(M.pos.y, 2) + ") на параболе расстояние до фокуса |MF| = " + format(df, 2) + " равно расстоянию до директрисы |MH| = " + format(dh, 2) + ".";
}
]
