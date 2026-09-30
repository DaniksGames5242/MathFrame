[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Восемь наблюдений (xᵢ, yᵢ). Оранжевая прямая ŷ = β̂₀ + β̂₁x — метод наименьших квадратов, синие отрезки — остатки.
// Зелёная прямая задаётся двумя ручками на краях поля: для неё считается та же сумма квадратов остатков. ----
new Point { name = "P1"; pos = (-5.5, -2.2); pauseOnDrag = false }
new Point { name = "P2"; pos = (-4.2, -0.2); pauseOnDrag = false }
new Point { name = "P3"; pos = (-2.6, -1.6); pauseOnDrag = false }
new Point { name = "P4"; pos = (-0.9, 0.8); pauseOnDrag = false }
new Point { name = "P5"; pos = (0.7, -0.4); pauseOnDrag = false }
new Point { name = "P6"; pos = (2.4, 2.0); pauseOnDrag = false }
new Point { name = "P7"; pos = (4.1, 0.6); pauseOnDrag = false }
new Point { name = "P8"; pos = (5.8, 3.0); pauseOnDrag = false }
new Point { name = "T1"; pos = (-6.5, -1); color = #22c55e; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "T2"; pos = (6.5, 1); color = #22c55e; pauseOnDrag = false; collideWithPoints = false }
draw Graph { name = "gR"; graph = "gr"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gL"; graph = "gl"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gT"; graph = "gt"; edgeColor = #22c55e; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }

// ---- Логика ----
float key = -1; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function px(k) { if (k == 0) { return P1.pos.x; } if (k == 1) { return P2.pos.x; } if (k == 2) { return P3.pos.x; } if (k == 3) { return P4.pos.x; } if (k == 4) { return P5.pos.x; } if (k == 5) { return P6.pos.x; } if (k == 6) { return P7.pos.x; } if (k == 7) { return P8.pos.x; } return 0; }
Function py(k) { if (k == 0) { return P1.pos.y; } if (k == 1) { return P2.pos.y; } if (k == 2) { return P3.pos.y; } if (k == 3) { return P4.pos.y; } if (k == 4) { return P5.pos.y; } if (k == 5) { return P6.pos.y; } if (k == 6) { return P7.pos.y; } if (k == 7) { return P8.pos.y; } return 0; }
Function clip(g, nm, x0, y0, dx, dy) {
  float t1 = -1000; float t2 = 1000;
  if (abs(dx) > 0.000001) { float a = (-fieldMaxX - x0) / dx; float b = (fieldMaxX - x0) / dx; t1 = max(t1, min(a, b)); t2 = min(t2, max(a, b)); }
  if (abs(dy) > 0.000001) { float c = (-fieldMaxY - y0) / dy; float d = (fieldMaxY - y0) / dy; t1 = max(t1, min(c, d)); t2 = min(t2, max(c, d)); }
  addNode(g, nm + "1", [x0 + t1 * dx, y0 + t1 * dy]); addNode(g, nm + "2", [x0 + t2 * dx, y0 + t2 * dy]); addEdge(g, nm + "1", nm + "2");
  return 0;
}
Function line(b0, b1, c) { return b0 + b1 * c; }
Function sgn(b0, b1) { if (b1 < 0) { return " − " + format(-b1, 2); } return " + " + format(b1, 2); }

Update {
  if (abs(T1.pos.x + 6.5) > 0.0001) { T1.pos.x = -6.5; }
  if (abs(T2.pos.x - 6.5) > 0.0001) { T2.pos.x = 6.5; }
  float k2 = T1.pos.y * 1.3 + T2.pos.y * 2.1; repeat (8) { k2 = k2 * 1.0137 + px(i) * (i + 3) + py(i) * (i + 7.3); }
  if (k2 != key) {
    key = k2;
    float mx = 0; float my = 0; repeat (8) { mx = mx + px(i) / 8; my = my + py(i) / 8; }
    float sxy = 0; float sxx = 0; float syy = 0;
    repeat (8) { sxy = sxy + (px(i) - mx) * (py(i) - my); sxx = sxx + (px(i) - mx) * (px(i) - mx); syy = syy + (py(i) - my) * (py(i) - my); }
    float b1 = 0; if (sxx > 0.000001) { b1 = sxy / sxx; }
    float b0 = my - b1 * mx;
    float tb1 = (T2.pos.y - T1.pos.y) / 13; float tb0 = T1.pos.y + tb1 * 6.5;
    float rss = 0; float rt = 0;
    gr = newGraph(); gl = newGraph(); gt = newGraph();
    repeat (8) {
      float e = py(i) - line(b0, b1, px(i)); rss = rss + e * e; float e2 = py(i) - line(tb0, tb1, px(i)); rt = rt + e2 * e2;
      if (abs(e) > 0.02) { addNode(gr, "a" + format(i, 0), [px(i), py(i)]); addNode(gr, "b" + format(i, 0), [px(i), line(b0, b1, px(i))]); addEdge(gr, "a" + format(i, 0), "b" + format(i, 0)); }
    }
    float u = clip(gl, "l", mx, my, 1, b1); float w = clip(gt, "m", 0, tb0, 1, tb1);
    float r2 = 0; if (syy > 0.000001) { r2 = 1 - rss / syy; }
    info = "**Прямая наименьших квадратов:** β̂₁ = Cov(X, Y)/Var(X) = " + num(b1, 3) + ", β̂₀ = Ȳ − β̂₁X̄ = " + num(b0, 3) + ", то есть ŷ = " + num(b0, 2) + sgn(b0, b1) + "·x. Она проходит через точку средних (x̄; ȳ) = (" + num(mx, 2) + "; " + num(my, 2) + ").\n\n";
    info = info + "**Сумма квадратов остатков** RSS = ∑(yᵢ − ŷᵢ)² = " + format(rss, 2) + " — минимум по всем прямым. Для зелёной прямой ŷ = " + num(tb0, 2) + sgn(tb0, tb1) + "·x она равна " + format(rt, 2) + ", то есть не меньше.\n\n";
    info = info + "**Коэффициент детерминации** R² = 1 − RSS/SS_tot = 1 − " + format(rss, 2) + "/" + format(syy, 2) + " = " + format(r2, 3) + " совпадает с квадратом выборочного коэффициента корреляции r² = " + format(sxy * sxy / max(sxx * syy, 0.000001), 3) + ".";
  }
}
]
