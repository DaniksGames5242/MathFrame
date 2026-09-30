[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Носитель распределения при k = 3 категориях — целочисленные точки симплекса x₁ + x₂ + x₃ = n
// (треугольная решётка). Размер кружка — вероятность вектора. Оранжевая точка — среднее (np₁, np₂, np₃),
// кольцо — ближайший к перетаскиваемой точке вектор. ----
draw Graph { name = "gX"; graph = "gx"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "g1"; graph = "g1"; nodeColor = #3b82f6; nodeRadius = 2.5; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "g2"; graph = "g2"; nodeColor = #3b82f6; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "g3"; graph = "g3"; nodeColor = #3b82f6; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "g4"; graph = "g4"; nodeColor = #3b82f6; nodeRadius = 11; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gS"; graph = "gs"; nodeColor = #f59e0b55; nodeRadius = 15; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "t1"; pos = (-6, -5.75); text = "x₁ = n"; size = 0.9 }
draw Text { name = "t2"; pos = (6, -5.75); text = "x₂ = n"; size = 0.9 }
draw Text { name = "t3"; pos = (0, 5.75); text = "x₃ = n"; size = 0.9 }

new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "Q"; pos = (2, -1); pauseOnDrag = false; collision = false; text = true("x") }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 1; max = 30; step = 1; default = 12 }
new UI { name = "sP1"; type = slider; label = "p₁"; variable = p1; min = 0.05; max = 0.9; step = 0.01; default = 0.5 }
new UI { name = "sP2"; type = slider; label = "p₂"; variable = p2; min = 0.05; max = 0.95 - p1; step = 0.01; default = 0.3 }

// ---- Логика ----
float n = 12; float p1 = 0.5; float p2 = 0.3; float key = -1; float init = 0;
list lfl = [0]; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function lp(x1, x2, x3) { return lfl[n] - lfl[x1] - lfl[x2] - lfl[x3] + x1 * log(p1) + x2 * log(p2) + x3 * log(1 - p1 - p2); }

Update {
  if (init == 0) { repeat (40) { push(lfl, lfl[i] + log(i + 1)); } init = 1; }
  float p3 = 1 - p1 - p2;
  if (key != n * 10000 + p1 * 100 + p2 * 1000000) {
    key = n * 10000 + p1 * 100 + p2 * 1000000;
    g1 = newGraph(); g2 = newGraph(); g3 = newGraph(); g4 = newGraph(); gx = newGraph();
    addNode(gx, "a", [-6, -5.2]); addNode(gx, "b", [6, -5.2]); addNode(gx, "c", [0, 5.2]);
    addEdge(gx, "a", "b"); addEdge(gx, "b", "c"); addEdge(gx, "c", "a");
    float pm = -1000;
    repeat (n + 1) { float a = i; repeat (n + 1 - a) { pm = max(pm, lp(n - a - i, a, i)); } }
    repeat (n + 1) {
      float a = i;
      repeat (n + 1 - a) {
        float c = i; float r = exp(lp(n - a - c, a, c) - pm);
        string k = format(a, 0) + "_" + format(c, 0); float px = 6 * (2 * a + c - n) / n; float py = -5.2 + 10.4 * c / n;
        if (r > 0.6) { addNode(g4, k, [px, py]); } else { if (r > 0.3) { addNode(g3, k, [px, py]); } else { if (r > 0.1) { addNode(g2, k, [px, py]); } else { addNode(g1, k, [px, py]); } } }
      }
    }
    M.pos.x = 6 * (p2 - p1 * 1); M.pos.y = -5.2 + 10.4 * p3;
  }
  // Q — внутри треугольника
  float b3 = (Q.pos.y + 5.2) / 10.4; float b2 = (1 - b3 + Q.pos.x / 6) / 2; float b1 = 1 - b2 - b3;
  if (b1 < 0 || b2 < 0 || b3 < 0) {
    b1 = max(b1, 0); b2 = max(b2, 0); b3 = max(b3, 0); float sm = b1 + b2 + b3; b1 = b1 / sm; b2 = b2 / sm; b3 = b3 / sm;
    Q.pos.x = 6 * (b2 - b1); Q.pos.y = -5.2 + 10.4 * b3;
  }
  float x2 = round(n * b2); float x3 = round(n * b3); float x1 = n - x2 - x3;
  if (x1 < 0) { if (x2 >= x3) { x2 = x2 + x1; } else { x3 = x3 + x1; } x1 = 0; }
  gs = newGraph(); addNode(gs, "s", [6 * (x2 - x1) / n, -5.2 + 10.4 * x3 / n]);
  float lq = lp(x1, x2, x3);
  float cf = exp(lfl[n] - lfl[x1] - lfl[x2] - lfl[x3]);
  float mb = exp(lfl[n] - lfl[x1] - lfl[n - x1] + x1 * log(p1) + (n - x1) * log(1 - p1));
  info = "**Полиномиальное распределение** Mult(n; p₁, p₂, p₃) при n = " + format(n, 0) + ", p = (" + format(p1, 2) + "; " + format(p2, 2) + "; " + format(p3, 2) + "): числа попаданий (x₁, x₂, x₃) в три категории за n независимых испытаний. Носитель — целочисленные точки x₁ + x₂ + x₃ = n (их " + format((n + 1) * (n + 2) / 2, 0) + "); размер кружка — вероятность вектора.\n\n";
  info = info + "**Выбранный вектор** x = (" + format(x1, 0) + "; " + format(x2, 0) + "; " + format(x3, 0) + "): мультиномиальный коэффициент n!/(x₁! x₂! x₃!) = " + format(cf, 0) + ", вероятность P(x) = " + format(exp(lq), 5) + ".\n\n";
  info = info + "**Среднее** np = (" + format(n * p1, 2) + "; " + format(n * p2, 2) + "; " + format(n * p3, 2) + ") — оранжевая точка. **Ковариации отрицательны:** Cov(X₁, X₂) = −np₁p₂ = −" + format(n * p1 * p2, 2) + " — сумма фиксирована, рост одной компоненты сдвигает другие вниз. **Маргинальное** распределение X₁ биномиально Bin(n, p₁): P(X₁ = " + format(x1, 0) + ") = " + format(mb, 4) + ".";
}
]
