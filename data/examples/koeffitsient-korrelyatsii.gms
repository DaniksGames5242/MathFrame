[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Восемь равновероятных точек (xᵢ, yᵢ) — совместное распределение (X, Y). Оранжевая прямая — линейная регрессия Y на X
// (через средние, наклон ρ·σᵧ/σₓ), синие отрезки — отклонения точек от неё. Внизу шкала от −1 до 1 с отметкой ρ. ----
new Point { name = "P1"; pos = (-5.5, -2.2); pauseOnDrag = false }
new Point { name = "P2"; pos = (-4.2, -2.8); pauseOnDrag = false }
new Point { name = "P3"; pos = (-2.6, -0.6); pauseOnDrag = false }
new Point { name = "P4"; pos = (-0.9, -1.2); pauseOnDrag = false }
new Point { name = "P5"; pos = (0.7, 0.9); pauseOnDrag = false }
new Point { name = "P6"; pos = (2.4, 0.4); pauseOnDrag = false }
new Point { name = "P7"; pos = (4.1, 2.9); pauseOnDrag = false }
new Point { name = "P8"; pos = (5.8, 2.1); pauseOnDrag = false }
draw Graph { name = "gR"; graph = "gr"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gL"; graph = "gl"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gS"; graph = "gs"; edgeColor = #3b82f688; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gK"; graph = "gk"; edgeColor = #22c55e; edgeWidth = 6; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "s0"; pos = (0, -4.05); text = "0"; size = 0.8 }
draw Text { name = "s1"; pos = (6, -4.05); text = "1"; size = 0.8 }
draw Text { name = "s2"; pos = (-6, -4.05); text = "−1"; size = 0.8 }
draw Text { name = "s3"; pos = (-7.6, -4.6); text = "ρ"; size = 0.9; align = left }
new UI { name = "sA"; type = slider; label = "множитель a у Y"; variable = ka; min = -3; max = 3; step = 0.5; default = -2 }

// ---- Логика ----
float ka = -2; float key = -1; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function px(k) { if (k == 0) { return P1.pos.x; } if (k == 1) { return P2.pos.x; } if (k == 2) { return P3.pos.x; } if (k == 3) { return P4.pos.x; } if (k == 4) { return P5.pos.x; } if (k == 5) { return P6.pos.x; } if (k == 6) { return P7.pos.x; } if (k == 7) { return P8.pos.x; } return 0; }
Function py(k) { if (k == 0) { return P1.pos.y; } if (k == 1) { return P2.pos.y; } if (k == 2) { return P3.pos.y; } if (k == 3) { return P4.pos.y; } if (k == 4) { return P5.pos.y; } if (k == 5) { return P6.pos.y; } if (k == 6) { return P7.pos.y; } if (k == 7) { return P8.pos.y; } return 0; }

Update {
  float k2 = ka; repeat (8) { k2 = k2 * 1.0137 + px(i) * (i + 3) + py(i) * (i + 7.3); }
  if (k2 != key) {
    key = k2;
    float mx = 0; float my = 0; repeat (8) { mx = mx + px(i) / 8; my = my + py(i) / 8; }
    float cov = 0; float vx = 0; float vy = 0;
    repeat (8) { float dx = px(i) - mx; float dy = py(i) - my; cov = cov + dx * dy / 8; vx = vx + dx * dx / 8; vy = vy + dy * dy / 8; }
    float sx = sqrt(vx); float sy = sqrt(vy); float r = 0; if (sx * sy > 0.000001) { r = cov / (sx * sy); }
    float bb = 0; if (vx > 0.000001) { bb = cov / vx; }
    gr = newGraph(); gl = newGraph(); gs = newGraph(); gk = newGraph();
    repeat (8) { float ly = my + bb * (px(i) - mx); if (abs(ly - py(i)) > 0.02) { addNode(gr, "a" + format(i, 0), [px(i), py(i)]); addNode(gr, "b" + format(i, 0), [px(i), ly]); addEdge(gr, "a" + format(i, 0), "b" + format(i, 0)); } }
    // прямая регрессии, обрезанная полем
    float xl = -fieldMaxX; float xr = fieldMaxX;
    if (abs(bb) > 0.000001) { float u1 = mx + (-fieldMaxY - my) / bb; float u2 = mx + (fieldMaxY - my) / bb; xl = max(xl, min(u1, u2)); xr = min(xr, max(u1, u2)); }
    addNode(gl, "l1", [xl, my + bb * (xl - mx)]); addNode(gl, "l2", [xr, my + bb * (xr - mx)]); addEdge(gl, "l1", "l2");
    addNode(gs, "r1", [-6, -4.6]); addNode(gs, "r2", [6, -4.6]); addEdge(gs, "r1", "r2");
    addNode(gs, "t1", [-6, -4.4]); addNode(gs, "t2", [-6, -4.8]); addEdge(gs, "t1", "t2");
    addNode(gs, "t3", [0, -4.4]); addNode(gs, "t4", [0, -4.8]); addEdge(gs, "t3", "t4");
    addNode(gs, "t5", [6, -4.4]); addNode(gs, "t6", [6, -4.8]); addEdge(gs, "t5", "t6");
    addNode(gk, "k1", [6 * r, -4.85]); addNode(gk, "k2", [6 * r, -4.35]); addEdge(gk, "k1", "k2");
    info = "**Коэффициент корреляции** ρ = Cov(X, Y)/(σₓ·σᵧ) — ковариация, нормированная на стандартные отклонения; он безразмерен и всегда лежит в отрезке [−1; 1].\n\n";
    info = info + "**Здесь ρ = " + num(r, 2) + ":** Cov = " + num(cov, 2) + ", σₓ = " + format(sx, 2) + ", σᵧ = " + format(sy, 2) + ". Оранжевая прямая — линейная связь Y от X; доля дисперсии Y, которую она объясняет, ρ² = " + format(r * r, 2) + ".";
    if (abs(r) > 0.999) { info = info + " Все точки лежат на одной прямой: |ρ| = 1."; }
    if (abs(r) < 0.05) { info = info + " Линейной связи нет, но это ещё не независимость: зависимость может быть нелинейной."; }
    info = info + "\n\n";
    if (ka == 0) { info = info + "При a = 0 величина aY постоянна, её σ = 0, и ρ(X, aY) не определён."; }
    else { info = info + "**Масштаб не влияет:** при a = " + num(ka, 1) + " ковариация Cov(X, aY) = " + num(ka * cov, 2) + " меняется, а ρ(X, aY) = " + num(sign(ka) * r, 2) + " — по модулю прежний (знак меняется, только если a < 0)."; }
  }
}
]
