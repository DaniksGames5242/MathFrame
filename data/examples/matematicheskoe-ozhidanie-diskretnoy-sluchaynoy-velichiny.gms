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
new Point { name = "M"; pos = (0, -4.2); dynamic = false; collision = false; color = #f59e0b }
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
  if (abs(M.pos.x - m) > 0.0001) { M.pos.x = m; M.pos.y = -4.2; }
  gB = newGraph(); gO = newGraph(); gX = newGraph(); gL = newGraph();
  addNode(gX, "a", [-9.5, -3]); addNode(gX, "b", [9.5, -3]); addEdge(gX, "a", "b");
  repeat (19) { float v = i - 9; addNode(gL, "l" + format(i, 0), [v, -5.2], num(v, 0)); addNode(gX, "s" + format(i, 0), [v, -3.15]); addNode(gX, "u" + format(i, 0), [v, -2.85]); addEdge(gX, "s" + format(i, 0), "u" + format(i, 0)); }
  addNode(gB, "a1", [x1, -3]); addNode(gB, "b1", [x1, -3 + 8 * p1]); addEdge(gB, "a1", "b1");
  addNode(gB, "a2", [x2, -3]); addNode(gB, "b2", [x2, -3 + 8 * p2]); addEdge(gB, "a2", "b2");
  addNode(gB, "a3", [x3, -3]); addNode(gB, "b3", [x3, -3 + 8 * p3]); addEdge(gB, "a3", "b3");
  addNode(gO, "m1", [m, -3]); addNode(gO, "m2", [m, -4.2]); addEdge(gO, "m1", "m2");
  info = "**Математическое ожидание** дискретной случайной величины — сумма значений, умноженных на их вероятности: E X = ∑ xᵢ·pᵢ. Это «центр масс» распределения: если на ось поставить грузы pᵢ в точках xᵢ, точка опоры M (жёлтая) уравновешивает их.\n\n"
    + "E X = " + num(x1, 2) + "·" + format(p1, 2) + " + " + num(x2, 2) + "·" + format(p2, 2) + " + " + num(x3, 2) + "·" + format(p3, 2) + " = **" + num(m, 3) + "**, при этом p₁ + p₂ + p₃ = " + format(p1 + p2 + p3, 2) + ".\n\n"
    + "Если вероятность сдвинуть к одному значению, центр M перемещается к нему; отклонения (xᵢ − M), взвешенные вероятностями, в сумме дают нуль.";
}
]
