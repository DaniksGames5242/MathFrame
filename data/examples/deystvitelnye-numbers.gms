[
description = "{info}"
field width = 20; field height = 6;
camera type = fixed;
show axes = true;
new Point { name = "A"; pos = (-3, 0); color = #3b82f6 }
new Point { name = "B"; pos = (3, 0); color = #f59e0b }
draw Graph { name = "gT"; graph = "g"; edgeColor = #22c55e; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false }
new UI { type = slider; label = "делений n"; variable = n; min = 4; max = 40; step = 1; default = 4 }
float n = 4; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(A.pos.y) > 0.001) { A.pos.y = 0; } if (abs(B.pos.y) > 0.001) { B.pos.y = 0; }
  float lo = A.pos.x; float hi = B.pos.x; if (lo > hi) { lo = B.pos.x; hi = A.pos.x; }
  g = newGraph();
  repeat (n + 1) { float x = lo + (hi - lo) * i / n; addNode(g, "t" + format(i, 0), [x, 0.6]); addNode(g, "b" + format(i, 0), [x, 0]); addEdge(g, "t" + format(i, 0), "b" + format(i, 0)); }
  info = "**Действительные числа** плотно и без пробелов заполняют числовую прямую: между A = " + num(A.pos.x, 2) + " и B = " + num(B.pos.x, 2) + " показаны " + format(n - 1, 0) + " равноотстоящих рациональных точек — но при увеличении n их становится сколь угодно много.\n\nМежду любыми двумя из них остаются и иррациональные числа: рациональные и иррациональные вместе, без единого пробела, образуют множество ℝ.";
}
]
