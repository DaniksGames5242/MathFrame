[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Слева: функция вероятностей X ∈ {0, 1} (сверху) и ступенчатая функция распределения (снизу); зелёный знак — E X = p на оси значений.
// Справа: дисперсия D X = p(1 − p) как функция параметра p. Единственный параметр p — положение точки на оси справа. ----
new Point { name = "Pp"; pos = (2.95, -4); pauseOnDrag = false; color = #f59e0b }
new Point { name = "Q"; pos = (2.95, 1.2); dynamic = false; collision = false; color = #f59e0b }
draw Graph { name = "gB"; graph = "gb"; edgeColor = #3b82f6; edgeWidth = 40; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "gc"; edgeColor = #3b82f6; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gV"; graph = "gv"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gM"; graph = "gm"; edgeColor = #22c55e; edgeWidth = 3; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "h1"; pos = (-7.6, 4.75); text = "P(X = x)"; size = 0.85; align = left }
draw Text { name = "h2"; pos = (-7.6, -0.4); text = "F(x) = P(X ≤ x)"; size = 0.85; align = left }
draw Text { name = "h3"; pos = (1.2, 4.75); text = "D X = p(1 − p)"; size = 0.85; align = left }
draw Text { name = "v0"; pos = (-5, 0.0); text = "0"; size = 0.85 }
draw Text { name = "v1"; pos = (-2, 0.0); text = "1"; size = 0.85 }
draw Text { name = "w0"; pos = (1, -4.55); text = "0"; size = 0.8 }
draw Text { name = "w1"; pos = (7.5, -4.55); text = "1"; size = 0.8 }
draw Text { name = "w2"; pos = (4.25, -4.55); text = "p"; size = 0.85 }

// ---- Логика ----
float pv = 0.3; float key = -1; string info = "";
Function fy(f) { return -4.6 + 3.5 * f; }

Update {
  float p = round(100 * (Pp.pos.x - 1) / 6.5) / 100; p = max(0.02, min(0.98, p));
  if (abs(Pp.pos.x - (1 + 6.5 * p)) > 0.001) { Pp.pos.x = 1 + 6.5 * p; }
  if (abs(Pp.pos.y + 4) > 0.001) { Pp.pos.y = -4; }
  if (p != key) {
    key = p;
    float qv = 1 - p; float d = p * qv;
    Q.pos.x = 1 + 6.5 * p; Q.pos.y = -4 + 24 * d;
    gb = newGraph(); gc = newGraph(); gv = newGraph(); gm = newGraph(); gd = newGraph(); ga = newGraph();
    addNode(gb, "a0", [-5, 0.3]); addNode(gb, "b0", [-5, 0.3 + 4.2 * qv]); addEdge(gb, "a0", "b0");
    addNode(gb, "a1", [-2, 0.3]); addNode(gb, "b1", [-2, 0.3 + 4.2 * p]); addEdge(gb, "a1", "b1");
    addNode(gc, "c0", [-7.5, fy(0)]); addNode(gc, "c1", [-5, fy(0)]); addNode(gc, "c2", [-5, fy(qv)]); addNode(gc, "c3", [-2, fy(qv)]); addNode(gc, "c4", [-2, fy(1)]); addNode(gc, "c5", [-0.5, fy(1)]);
    addEdge(gc, "c0", "c1"); addEdge(gc, "c1", "c2"); addEdge(gc, "c2", "c3"); addEdge(gc, "c3", "c4"); addEdge(gc, "c4", "c5");
    repeat (41) { addNode(gv, "v" + format(i, 0), [1 + 6.5 * i / 40, -4 + 24 * (i / 40) * (1 - i / 40)]); if (i > 0) { addEdge(gv, "v" + format(i - 1, 0), "v" + format(i, 0)); } }
    addNode(gm, "m1", [-5 + 3 * p, -0.85]); addNode(gm, "m2", [-5 + 3 * p, -0.35]); addEdge(gm, "m1", "m2");
    addNode(gd, "d1", [1 + 6.5 * p, -4]); addNode(gd, "d2", [1 + 6.5 * p, -4 + 24 * d]); addEdge(gd, "d1", "d2");
    addNode(ga, "x1", [-7.5, 0.3]); addNode(ga, "x2", [-0.5, 0.3]); addEdge(ga, "x1", "x2");
    addNode(ga, "x3", [-7.5, fy(0)]); addNode(ga, "x4", [-0.5, fy(0)]); addEdge(ga, "x3", "x4");
    addNode(ga, "x5", [-7.5, fy(1)]); addNode(ga, "x6", [-0.5, fy(1)]); addEdge(ga, "x5", "x6");
    addNode(ga, "x7", [1, -4]); addNode(ga, "x8", [7.5, -4]); addEdge(ga, "x7", "x8");
    info = "**Распределение Бернулли** Bern(p) — модель одного опыта с двумя исходами: X = 1 («успех») с вероятностью p и X = 0 с вероятностью 1 − p; единственный параметр p.\n\n";
    info = info + "**Здесь p = " + format(p, 2) + ":** P(X = 1) = " + format(p, 2) + ", P(X = 0) = " + format(qv, 2) + ". Функция распределения F(x) = 0 при x < 0, F(x) = " + format(qv, 2) + " при 0 ≤ x < 1 и F(x) = 1 при x ≥ 1 — скачки в точках 0 и 1 равны вероятностям значений.\n\n";
    info = info + "E X = p = " + format(p, 2) + " (зелёная отметка), D X = p(1 − p) = " + format(d, 3) + ", σ = " + format(sqrt(d), 3) + "; дисперсия наибольшая (¼) при p = ½. Производящая функция моментов M(t) = 1 − p + p·eᵗ. Сумма n независимых Bern(p) — биномиальное B(n, p); Bern(p) = B(1, p).";
  }
}
]
