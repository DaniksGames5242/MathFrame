[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Восемь наблюдений (xᵢ, yᵢ). Зелёная прямая — МНК-прямая, оранжевая — пробная (a, b) с ползунков.
// Синие квадраты — квадраты вертикальных отклонений пробной прямой: их суммарная площадь S(a, b) — то, что минимизирует МНК. ----
new Point { name = "P1"; pos = (-6.0, -2.4); pauseOnDrag = false }
new Point { name = "P2"; pos = (-4.4, -0.2); pauseOnDrag = false }
new Point { name = "P3"; pos = (-2.8, -1.6); pauseOnDrag = false }
new Point { name = "P4"; pos = (-1.2, 1.2); pauseOnDrag = false }
new Point { name = "P5"; pos = (0.4, 0.2); pauseOnDrag = false }
new Point { name = "P6"; pos = (2.0, 2.4); pauseOnDrag = false }
new Point { name = "P7"; pos = (3.6, 1.0); pauseOnDrag = false }
new Point { name = "P8"; pos = (5.2, 3.2); pauseOnDrag = false }
draw Function { name = "gO"; f = "fo"; xmin = -8; xmax = 8; thickness = 3; color = #22c55e; layer = 8 }
draw Function { name = "gT"; f = "ft"; xmin = -8; xmax = 8; thickness = 2.5; color = #f59e0b; layer = 7 }
draw Graph { name = "gQ"; graph = "gq"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
new UI { name = "sA"; type = slider; label = "a (пробная прямая)"; variable = aT; min = -4; max = 4; step = 0.1; default = 1 }
new UI { name = "sB"; type = slider; label = "b (пробная прямая)"; variable = bT; min = -2; max = 2; step = 0.1; default = 0.2 }

// ---- Логика ----
float aT = 1; float bT = 0.2; float ao = 0; float bo = 0; float key = -1e9; string info = "";
func fo(x) = ao + bo * x;
func ft(x) = aT + bT * x;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return " − " + format(-x, d); } return " + " + format(x, d); }
Function px(k) { if (k == 0) { return P1.pos.x; } if (k == 1) { return P2.pos.x; } if (k == 2) { return P3.pos.x; } if (k == 3) { return P4.pos.x; } if (k == 4) { return P5.pos.x; } if (k == 5) { return P6.pos.x; } if (k == 6) { return P7.pos.x; } return P8.pos.x; }
Function py(k) { if (k == 0) { return P1.pos.y; } if (k == 1) { return P2.pos.y; } if (k == 2) { return P3.pos.y; } if (k == 3) { return P4.pos.y; } if (k == 4) { return P5.pos.y; } if (k == 5) { return P6.pos.y; } if (k == 6) { return P7.pos.y; } return P8.pos.y; }

Update {
  float k2 = aT * 7.3 + bT * 3.1; repeat (8) { k2 = k2 * 1.0137 + px(i) * (i + 3) + py(i) * (i + 7.3); }
  if (k2 != key) {
    key = k2;
    float mx = 0; float my = 0; repeat (8) { mx = mx + px(i) / 8; my = my + py(i) / 8; }
    float sxy = 0; float sxx = 0; repeat (8) { sxy = sxy + (px(i) - mx) * (py(i) - my); sxx = sxx + (px(i) - mx) * (px(i) - mx); }
    bo = 0; if (sxx > 0.000001) { bo = sxy / sxx; }
    ao = my - bo * mx;
    float S = 0; float Sm = 0; float sr = 0;
    gq = newGraph();
    repeat (8) {
      float r1 = py(i) - aT - bT * px(i); S = S + r1 * r1;
      float r2 = py(i) - ao - bo * px(i); Sm = Sm + r2 * r2; sr = sr + r2;
      float yl = aT + bT * px(i); float d = 0; float ar = abs(r1);
      if (px(i) + ar < fieldMaxX - 0.1) { d = ar; } else { if (px(i) - ar > -fieldMaxX + 0.1) { d = -ar; } }
      if (ar > 0.05 && d != 0 && abs(yl) < fieldMaxY) {
        string id = format(i, 0);
        addNode(gq, "a" + id, [px(i), py(i)]); addNode(gq, "b" + id, [px(i), yl]); addNode(gq, "c" + id, [px(i) + d, yl]); addNode(gq, "d" + id, [px(i) + d, py(i)]);
        addEdge(gq, "a" + id, "b" + id); addEdge(gq, "b" + id, "c" + id); addEdge(gq, "c" + id, "d" + id); addEdge(gq, "d" + id, "a" + id);
      }
    }
    info = "**Метод наименьших квадратов.** Для прямой ŷ = a + bx отклонение i-го наблюдения по вертикали — eᵢ = yᵢ − a − bxᵢ; МНК выбирает a и b так, чтобы сумма квадратов **S(a, b) = ∑ eᵢ²** была наименьшей. Квадрат убирает знаки и сильнее штрафует большие отклонения.\n\n";
    info = info + "**Пробная прямая** ŷ = " + num(aT, 1) + term(bT, 1) + "x: S = **" + format(S, 2) + "** (сумма площадей синих квадратов).\n\n";
    info = info + "**МНК-прямая** из нормальных уравнений: b = ∑(xᵢ − x̄)(yᵢ − ȳ) / ∑(xᵢ − x̄)² = " + num(sxy, 2) + " / " + format(sxx, 2) + " = **" + num(bo, 3) + "**, a = ȳ − b·x̄ = **" + num(ao, 3) + "**. Её минимум S_min = **" + format(Sm, 2) + "**; сумма отклонений ∑ eᵢ = " + num(sr, 3) + ".\n\n";
    if (S - Sm < 0.005) { info = info + "Пробная прямая совпала с МНК-прямой: S − S_min = 0."; }
    else { info = info + "Любая другая прямая хуже: S − S_min = **" + format(S - Sm, 2) + "** > 0 (сумма квадратов — выпуклая функция параметров, минимум единственный)."; }
  }
}
]
