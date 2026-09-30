[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Три значения x₁, x₂, x₃ (перетаскиваемые точки на оси), вероятности p₁, p₂ и
// p₃ = 1 − p₁ − p₂ (столбики). ----
float p1 = 0.3; float p2 = 0.5; string info = "";
new Point { name = "X1"; pos = (-4, -3); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "X2"; pos = (1, -3); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "X3"; pos = (6, -3); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "M"; pos = (0, -3); dynamic = false; collision = false; color = #f59e0b }
draw Graph { name = "vB"; graph = "gB"; edgeColor = #3b82f6; edgeWidth = 22; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "vO"; graph = "gO"; edgeColor = #f59e0b; edgeWidth = 4; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 11 }
draw Graph { name = "vX"; graph = "gX"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "vL"; graph = "gL"; nodeRadius = 0; labels = true; interactive = false; showWeights = false; layer = 6 }
new UI { type = slider; label = "p₁"; variable = p1; min = 0.05; max = 0.9 - p2; step = 0.05; default = 0.3 }
new UI { type = slider; label = "p₂"; variable = p2; min = 0.05; max = 0.9 - p1; step = 0.05; default = 0.5 }

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function clampx(x) { return min(max(x, -8.5), 8.5); }

Update {
  float p3 = 1 - p1 - p2;
  float x1 = clampx(X1.pos.x); float x2 = clampx(X2.pos.x); float x3 = clampx(X3.pos.x);
  if (abs(X1.pos.y + 3) > 0.0001) { X1.pos.y = -3; }
  if (abs(X2.pos.y + 3) > 0.0001) { X2.pos.y = -3; }
  if (abs(X3.pos.y + 3) > 0.0001) { X3.pos.y = -3; }
  float m = x1 * p1 + x2 * p2 + x3 * p3;
  float d = (x1 - m) * (x1 - m) * p1 + (x2 - m) * (x2 - m) * p2 + (x3 - m) * (x3 - m) * p3;
  float sg = sqrt(d);
  float ex2 = x1 * x1 * p1 + x2 * x2 * p2 + x3 * x3 * p3;
  if (abs(M.pos.x - m) > 0.0001) { M.pos.x = m; M.pos.y = -3; }
  gB = newGraph(); gO = newGraph(); gX = newGraph(); gL = newGraph();
  addNode(gX, "a", [-9.5, -3]); addNode(gX, "b", [9.5, -3]); addEdge(gX, "a", "b");
  repeat (19) { float v = i - 9; addNode(gL, "l" + format(i, 0), [v, -4.9], num(v, 0)); addNode(gX, "s" + format(i, 0), [v, -3.15]); addNode(gX, "u" + format(i, 0), [v, -2.85]); addEdge(gX, "s" + format(i, 0), "u" + format(i, 0)); }
  addNode(gB, "a1", [x1, -3]); addNode(gB, "b1", [x1, -3 + 8 * p1]); addEdge(gB, "a1", "b1");
  addNode(gB, "a2", [x2, -3]); addNode(gB, "b2", [x2, -3 + 8 * p2]); addEdge(gB, "a2", "b2");
  addNode(gB, "a3", [x3, -3]); addNode(gB, "b3", [x3, -3 + 8 * p3]); addEdge(gB, "a3", "b3");
  // отклонения xᵢ − M отрезками (жёлтые) и интервал M ± σ
  addNode(gO, "d1", [x1, -3.5]); addNode(gO, "d2", [m, -3.5]); addEdge(gO, "d1", "d2");
  addNode(gO, "e1", [x2, -3.85]); addNode(gO, "e2", [m, -3.85]); addEdge(gO, "e1", "e2");
  addNode(gO, "f1", [x3, -4.2]); addNode(gO, "f2", [m, -4.2]); addEdge(gO, "f1", "f2");
  if (sg > 0.02) {
    addNode(gO, "s1", [m - sg, 5.2]); addNode(gO, "s2", [m + sg, 5.2]); addEdge(gO, "s1", "s2");
    addNode(gO, "s3", [m - sg, 4.9]); addNode(gO, "s4", [m - sg, 5.5]); addEdge(gO, "s3", "s4");
    addNode(gO, "s5", [m + sg, 4.9]); addNode(gO, "s6", [m + sg, 5.5]); addEdge(gO, "s5", "s6");
  }
  info = "**Дисперсия** дискретной случайной величины — математическое ожидание квадрата отклонения от E X: D X = ∑ (xᵢ − E X)²·pᵢ. Она измеряет разброс значений вокруг центра M = E X (жёлтые отрезки — отклонения xᵢ − M).\n\n"
    + "E X = " + num(m, 3) + ", D X = " + format(p1, 2) + "·(" + num(x1 - m, 2) + ")² + " + format(p2, 2) + "·(" + num(x2 - m, 2) + ")² + " + format(p3, 2) + "·(" + num(x3 - m, 2) + ")² = **" + format(d, 3) + "**, σ = √D X = " + format(sg, 3) + " (сверху — отрезок M ± σ).\n\n"
    + "Проверка по формуле D X = E X² − (E X)² = " + format(ex2, 3) + " − " + format(m * m, 3) + " = " + format(ex2 - m * m, 3) + ". D X ≥ 0, а равна нулю только когда все значения с ненулевой вероятностью совпадают.";
}
]
