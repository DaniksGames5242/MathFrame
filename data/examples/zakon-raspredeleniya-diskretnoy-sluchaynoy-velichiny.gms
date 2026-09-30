[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Закон распределения — пары (xᵢ; pᵢ): значения на числовой прямой и вероятности
// столбиками. Ползунки p₁…p₄ задают закон, p₅ = 1 − p₁ − … − p₄ (сумма всегда 1).
// Синяя черта t — порог, по закону считаем P(X < t) (жёлтые столбики). ----
float p1 = 0.1; float p2 = 0.2; float p3 = 0.3; float p4 = 0.2; float t = 1; string info = "";
draw Graph { name = "vB"; graph = "gB"; edgeColor = #3b82f6; edgeWidth = 30; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "vO"; graph = "gO"; edgeColor = #f59e0b; edgeWidth = 30; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 11 }
draw Graph { name = "vT"; graph = "gT"; edgeColor = #22c55e; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 12 }
draw Graph { name = "vX"; graph = "gX"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "vL"; graph = "gL"; nodeRadius = 0; labels = true; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "t1"; pos = (-9.7, 5.5); text = "pᵢ = P(X = xᵢ)"; size = 0.9; align = left }
new UI { type = slider; label = "p₁"; variable = p1; min = 0.01; max = 0.96 - p2 - p3 - p4; step = 0.01; default = 0.1 }
new UI { type = slider; label = "p₂"; variable = p2; min = 0.01; max = 0.96 - p1 - p3 - p4; step = 0.01; default = 0.2 }
new UI { type = slider; label = "p₃"; variable = p3; min = 0.01; max = 0.96 - p1 - p2 - p4; step = 0.01; default = 0.3 }
new UI { type = slider; label = "p₄"; variable = p4; min = 0.01; max = 0.96 - p1 - p2 - p3; step = 0.01; default = 0.2 }
new UI { type = slider; label = "t"; variable = t; min = -3.5; max = 4.5; step = 0.5; default = 1 }

Function xv(i) { if (i < 0.5) { return -3; } if (i < 1.5) { return -1; } if (i < 2.5) { return 0; } if (i < 3.5) { return 2; } return 4; }
Function pv(i) { if (i < 0.5) { return p1; } if (i < 1.5) { return p2; } if (i < 2.5) { return p3; } if (i < 3.5) { return p4; } return 1 - p1 - p2 - p3 - p4; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  gB = newGraph(); gO = newGraph(); gT = newGraph(); gX = newGraph(); gL = newGraph();
  addNode(gX, "a", [-9.7, -4.0]); addNode(gX, "b", [9.7, -4.0]); addEdge(gX, "a", "b");
  addNode(gT, "t1", [t * 1.7, -4.4]); addNode(gT, "t2", [t * 1.7, 5.3]); addEdge(gT, "t1", "t2");
  float below = 0; string tab = "";
  repeat (5) {
    float x = xv(i); float p = pv(i); string js = format(i, 0);
    addNode(gL, "l" + js, [x * 1.7, -4.7], num(x, 0));
    if (x < t) {
      below = below + p;
      addNode(gO, "p" + js, [x * 1.7, -4.0]); addNode(gO, "q" + js, [x * 1.7, -4.0 + 9 * p]); addEdge(gO, "p" + js, "q" + js);
    } else {
      addNode(gB, "p" + js, [x * 1.7, -4.0]); addNode(gB, "q" + js, [x * 1.7, -4.0 + 9 * p]); addEdge(gB, "p" + js, "q" + js);
    }
    tab = tab + "P(X = " + num(x, 0) + ") = " + format(p, 2);
    if (i < 3.5) { tab = tab + ";  "; }
  }
  info = "**Закон распределения** дискретной случайной величины X — соответствие между каждым возможным значением xᵢ и вероятностью pᵢ = P(X = xᵢ). Здесь оно задано таблицей:\n\n" + tab + ".\n\n"
    + "Сумма вероятностей равна 1: " + format(p1, 2) + " + " + format(p2, 2) + " + " + format(p3, 2) + " + " + format(p4, 2) + " + " + format(pv(4), 2) + " = 1.\n\n"
    + "Закон определяет и остальные вероятности сложением по значениям: P(X < " + num(t, 1) + ") = **" + format(below, 2) + "**.";
}
]
