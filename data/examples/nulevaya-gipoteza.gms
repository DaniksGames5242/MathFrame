[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Нулевая гипотеза H₀: μ = 0 (σ = 1 известна). Если она верна, выборочное среднее x̄ по n наблюдениям
// имеет распределение N(0; 1/n) — кривая. Точка — наблюдённое x̄; закрашены значения, не менее удалённые
// от 0, чем наблюдённое (их вероятность — p-значение). Зелёные линии — границы критической области (α = 0.05). ----
float y0 = -4; float kx = 6.5; float n = 25; float key = -1; string info = "";

func h0(x) = y0 + 7.5 * exp(-(x / kx) * (x / kx) * n / 2);
draw Function { name = "f0"; f = "h0"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 4.6; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f677; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "gc"; edgeColor = #22c55e; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "x1"; pos = (-kx, y0 - 0.6); text = "−1"; size = 0.7 }
draw Text { name = "x2"; pos = (-kx / 2, y0 - 0.6); text = "−0.5"; size = 0.7 }
draw Text { name = "x0"; pos = (0, y0 - 0.6); text = "0"; size = 0.7 }
draw Text { name = "y2"; pos = (kx / 2, y0 - 0.6); text = "0.5"; size = 0.7 }
draw Text { name = "y1"; pos = (kx, y0 - 0.6); text = "1"; size = 0.7 }
draw Text { name = "xl"; pos = (9.6, y0 + 0.6); text = "x̄"; size = 0.9 }
draw Text { name = "h0l"; pos = (-3.4, y0 + 6.2); text = "H₀: μ = 0"; size = 1 }
draw Text { name = "xo"; pos = (X.pos.x, y0 - 1.3); text = "x̄"; size = 0.9 }

new Point { name = "L1"; pos = (-10, y0); dynamic = false; active = false }
new Point { name = "L2"; pos = (10, y0); dynamic = false; active = false }
new Line { name = "axisLine"; pos = (L1, L2); active = false; interact = false }
new Point { name = "X"; line = "axisLine"; t = 0.63; pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new UI { type = slider; label = "объём выборки n"; variable = n; min = 4; max = 100; step = 1; default = 25 }

Function num(x, dd) { if (x < -0.00001) { return "−" + format(-x, dd); } return format(abs(x), dd); }

Update {
  float xb = X.pos.x / kx; float z = xb * sqrt(n);
  if (key != round(X.pos.x * 1000) + n * 100000) {
    gb = newGraph(); ga = newGraph(); gc = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    repeat (5) {
      float tx = -kx + kx / 2 * i;
      addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0));
    }
    float xc = 1.96 * kx / sqrt(n);
    addNode(gc, "c1", [xc, y0]); addNode(gc, "c2", [xc, y0 + 3]); addEdge(gc, "c1", "c2");
    addNode(gc, "c3", [-xc, y0]); addNode(gc, "c4", [-xc, y0 + 3]); addEdge(gc, "c3", "c4");
    repeat (200) {
      float x = -9.95 + 0.1 * i; string id = format(i, 0);
      if (abs(x) >= abs(X.pos.x)) { addNode(gb, "a" + id, [x, y0]); addNode(gb, "b" + id, [x, h0(x)]); addEdge(gb, "a" + id, "b" + id, 1, "#f59e0b"); }
    }
    key = round(X.pos.x * 1000) + n * 100000;
  }
  float p = 2 * (1 - normalCdf(abs(z), 0, 1));
  info = "**Нулевая гипотеза H₀: μ = 0** — предположение, которое проверяется по выборке. Критерий строят так, чтобы его распределение было известно именно при верной H₀: при σ = 1 и n = **" + format(n, 0) + "** выборочное среднее x̄ имеет распределение N(0; 1/n), а Z = x̄√n ~ N(0; 1).\n\n";
  info = info + "Наблюдённое x̄ = **" + num(xb, 3) + "**, Z = **" + num(z, 2) + "**. Вероятность получить данные не менее «экстремальные» при верной H₀ — p = **" + format(p, 4) + "** (закрашено).\n\n";
  if (p < 0.05) { info = info + "p < 0.05: данные противоречат H₀ на уровне значимости 0.05 — **H₀ отвергается** (значение x̄ вне зелёных границ). Вероятность ошибочного отвержения верной H₀ при этом равна 0.05."; }
  if (p >= 0.05) { info = info + "p ≥ 0.05: данные не противоречат H₀ — **оснований отвергнуть её нет** (x̄ между зелёными границами). Это не доказательство H₀: при малом n ложная H₀ тоже устойчиво не отвергается."; }
}
]
