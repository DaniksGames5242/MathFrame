[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Выборка из 8 пар (xᵢ, yᵢ). Серый крест — выборочные средние (x̄, ȳ). Прямоугольник от точки до центра — произведение
// отклонений (xᵢ − x̄)(yᵢ − ȳ): синий при положительном знаке (I и III четверти), оранжевый при отрицательном. ----
new Point { name = "P1"; pos = (-5.5, -2.6); pauseOnDrag = false }
new Point { name = "P2"; pos = (-4.2, 0.4); pauseOnDrag = false }
new Point { name = "P3"; pos = (-2.6, -1.2); pauseOnDrag = false }
new Point { name = "P4"; pos = (-0.9, 1.6); pauseOnDrag = false }
new Point { name = "P5"; pos = (0.7, -0.4); pauseOnDrag = false }
new Point { name = "P6"; pos = (2.4, 2.6); pauseOnDrag = false }
new Point { name = "P7"; pos = (4.1, 0.9); pauseOnDrag = false }
new Point { name = "P8"; pos = (5.8, 3.0); pauseOnDrag = false }
draw Graph { name = "gP"; graph = "gp"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gN"; graph = "gn"; edgeColor = #f59e0b; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gM"; graph = "gm"; edgeColor = #3b82f6; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gK"; graph = "gk"; edgeColor = #22c55e; edgeWidth = 6; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "s0"; pos = (0, -4.05); text = "0"; size = 0.8 }
draw Text { name = "s1"; pos = (6, -4.05); text = "1"; size = 0.8 }
draw Text { name = "s2"; pos = (-6, -4.05); text = "−1"; size = 0.8 }
draw Text { name = "s3"; pos = (-7.6, -4.6); text = "r"; size = 0.9; align = left }
new UI { name = "sA"; type = slider; label = "масштаб a: X → aX + b"; variable = ka; min = -3; max = 3; step = 0.5; default = 2 }

// ---- Логика ----
float ka = 2; float key = -1; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function px(k) { if (k == 0) { return P1.pos.x; } if (k == 1) { return P2.pos.x; } if (k == 2) { return P3.pos.x; } if (k == 3) { return P4.pos.x; } if (k == 4) { return P5.pos.x; } if (k == 5) { return P6.pos.x; } if (k == 6) { return P7.pos.x; } if (k == 7) { return P8.pos.x; } return 0; }
Function py(k) { if (k == 0) { return P1.pos.y; } if (k == 1) { return P2.pos.y; } if (k == 2) { return P3.pos.y; } if (k == 3) { return P4.pos.y; } if (k == 4) { return P5.pos.y; } if (k == 5) { return P6.pos.y; } if (k == 6) { return P7.pos.y; } if (k == 7) { return P8.pos.y; } return 0; }
Function box(g, k, x0, y0, x1, y1) {
  addNode(g, "p" + format(k, 0) + "a", [x0, y0]); addNode(g, "p" + format(k, 0) + "b", [x1, y0]); addNode(g, "p" + format(k, 0) + "c", [x1, y1]); addNode(g, "p" + format(k, 0) + "d", [x0, y1]);
  addEdge(g, "p" + format(k, 0) + "a", "p" + format(k, 0) + "b"); addEdge(g, "p" + format(k, 0) + "b", "p" + format(k, 0) + "c"); addEdge(g, "p" + format(k, 0) + "c", "p" + format(k, 0) + "d"); addEdge(g, "p" + format(k, 0) + "d", "p" + format(k, 0) + "a");
  return 0;
}

Update {
  float k2 = ka; repeat (8) { k2 = k2 * 1.0137 + px(i) * (i + 3) + py(i) * (i + 7.3); }
  if (k2 != key) {
    key = k2;
    float mx = 0; float my = 0; repeat (8) { mx = mx + px(i) / 8; my = my + py(i) / 8; }
    float sxy = 0; float sxx = 0; float syy = 0;
    gp = newGraph(); gn = newGraph(); gm = newGraph(); gk = newGraph(); ga = newGraph();
    repeat (8) {
      float dx = px(i) - mx; float dy = py(i) - my; sxy = sxy + dx * dy; sxx = sxx + dx * dx; syy = syy + dy * dy;
      if (abs(dx * dy) > 0.02) { if (dx * dy > 0) { float u = box(gp, i, mx, my, px(i), py(i)); } else { float w = box(gn, i, mx, my, px(i), py(i)); } }
    }
    float r = 0; if (sxx * syy > 0.000001) { r = sxy / sqrt(sxx * syy); }
    addNode(gm, "h1", [-fieldMaxX, my]); addNode(gm, "h2", [fieldMaxX, my]); addEdge(gm, "h1", "h2");
    addNode(gm, "v1", [mx, -fieldMaxY]); addNode(gm, "v2", [mx, fieldMaxY]); addEdge(gm, "v1", "v2");
    addNode(ga, "r1", [-6, -4.6]); addNode(ga, "r2", [6, -4.6]); addEdge(ga, "r1", "r2");
    addNode(ga, "t1", [-6, -4.4]); addNode(ga, "t2", [-6, -4.8]); addEdge(ga, "t1", "t2");
    addNode(ga, "t3", [0, -4.4]); addNode(ga, "t4", [0, -4.8]); addEdge(ga, "t3", "t4");
    addNode(ga, "t5", [6, -4.4]); addNode(ga, "t6", [6, -4.8]); addEdge(ga, "t5", "t6");
    addNode(gk, "k1", [6 * r, -4.85]); addNode(gk, "k2", [6 * r, -4.35]); addEdge(gk, "k1", "k2");
    info = "**Средние:** x̄ = " + num(mx, 2) + ", ȳ = " + num(my, 2) + ". Суммы: ∑(xᵢ − x̄)(yᵢ − ȳ) = " + num(sxy, 2) + ", ∑(xᵢ − x̄)² = " + format(sxx, 2) + ", ∑(yᵢ − ȳ)² = " + format(syy, 2) + ".\n\n";
    info = info + "**r = " + num(sxy, 2) + " / √(" + format(sxx, 2) + " · " + format(syy, 2) + ") = " + num(r, 3) + "**. Знак совпадает со знаком ковариации: " ;
    if (sxy > 0) { info = info + "синих прямоугольников больше по площади, связь прямая."; } else { info = info + "оранжевых прямоугольников больше по площади, связь обратная."; }
    info = info + " Модуль не превосходит 1 (неравенство Коши — Буняковского для векторов отклонений); |r| = 1 — только при точной линейной зависимости.\n\n";
    if (ka == 0) { info = info + "При a = 0 все значения aX + b равны, s_X = 0 и r не определён."; }
    else { info = info + "**Инвариантность:** для X′ = " + num(ka, 1) + "·X + b выборочный коэффициент равен " + num(sign(ka) * r, 3) + " при любом b — по модулю прежний" ; if (ka < 0) { info = info + ", знак изменился, так как масштаб отрицателен"; } info = info + "."; }
  }
}
]
