[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Вкладка 1: правосторонний критерий, отвергаем H₀ при Z ≥ c. При H₀ статистика Z ~ N(0; 1), при верной
// альтернативе — N(δ; 1), δ = (μ₁ − μ₀)√n / σ. Зелёная область — мощность 1 − β, оранжевая — уровень α.
// Вкладка 2: мощность как функция расстояния μ₁ − μ₀ до нуля при текущих n и α. ----
float y0 = -4; float d = 0.5; float n = 4; float al = 0.05; float dl = 1; float cc = 1.645; float key = -1; float tab = 1; string info = "";
float ya = -4.5; float dp = 0.5; float k3 = -1; float pp = 0;

func h0(x) = y0 + 7.5 * exp(-x * x / 8);
func h1(x) = y0 + 7.5 * exp(-(x - 2 * dl) * (x - 2 * dl) / 8);
func wf(x) = ya + 8.5 * (1 - normalCdf(cc - (x + 8) / 16 * sqrt(n), 0, 1));
draw Function { name = "f0"; f = "h0"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Function { name = "f1"; f = "h1"; xmin = -10; xmax = 10; thickness = 3; color = #22c55e; layer = 30 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 4.6; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f677; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "x4"; pos = (-8, y0 - 0.6); text = "−4"; size = 0.7 }
draw Text { name = "x2"; pos = (-4, y0 - 0.6); text = "−2"; size = 0.7 }
draw Text { name = "x0"; pos = (0, y0 - 0.6); text = "0"; size = 0.7 }
draw Text { name = "y2"; pos = (4, y0 - 0.6); text = "2"; size = 0.7 }
draw Text { name = "y4"; pos = (8, y0 - 0.6); text = "4"; size = 0.7 }
draw Text { name = "zl"; pos = (9.6, y0 + 0.6); text = "Z"; size = 0.9 }
draw Text { name = "h0l"; pos = (-2.6, y0 + 5.6); text = "H₀"; size = 1 }
draw Text { name = "h1l"; pos = (2 * dl + 2.6, y0 + 5.6); text = "H₁"; size = 1; color = #22c55e }
draw Text { name = "cl"; pos = (2 * cc, y0 + 0.9); text = "c"; size = 0.9 }
new Claster { name = "tab1"; elements = (f0, f1, gB, gA, x4, x2, x0, y2, y4, zl, h0l, h1l, cl); active = true }

draw Function { name = "fW"; f = "wf"; xmin = -10; xmax = 10; thickness = 3; color = #22c55e; layer = 30 }
draw Graph { name = "gW"; graph = "gw"; edgeColor = #3b82f677; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "w0"; pos = (-8, ya - 0.6); text = "0"; size = 0.7 }
draw Text { name = "w5"; pos = (0, ya - 0.6); text = "0.5"; size = 0.7 }
draw Text { name = "w1"; pos = (8, ya - 0.6); text = "1"; size = 0.7 }
draw Text { name = "wx"; pos = (9.2, ya + 0.6); text = "μ₁ − μ₀"; size = 0.8; align = right }
draw Text { name = "wy"; pos = (-9.6, 4.6); text = "1 − β"; size = 0.9; align = left }
draw Text { name = "wa"; pos = (-9.6, ya + 8.5 * al + 0.5); text = "α"; size = 0.9; align = left }
new Point { name = "L1"; pos = (-8, ya); dynamic = false; active = false }
new Point { name = "L2"; pos = (8, ya); dynamic = false; active = false }
new Line { name = "axisLine"; pos = (L1, L2); active = false; interact = false }
new Point { name = "P"; line = "axisLine"; t = 0.5; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new Line { name = "pm"; pos = (P, M); interact = false; layer = 12 }
new Claster { name = "tab2"; elements = (fW, gW, w0, w5, w1, wx, wy, wa, P, M, pm); active = false }

new UI { name = "b1"; type = button; label = "Распределения"; action = "tab = 1; tab1.active = true; tab2.active = false" }
new UI { name = "b2"; type = button; label = "Кривая мощности"; action = "tab = 2; tab1.active = false; tab2.active = true" }
new UI { type = slider; label = "μ₁ − μ₀ (в σ)"; variable = d; min = 0.1; max = 1; step = 0.05; default = 0.5 }
new UI { type = slider; label = "объём выборки n"; variable = n; min = 1; max = 12; step = 1; default = 4 }
new UI { type = slider; label = "уровень значимости α"; variable = al; min = 0.01; max = 0.2; step = 0.01; default = 0.05 }

Function qn(p) { float lo = -6; float hi = 6; repeat (40) { float m = (lo + hi) / 2; if (normalCdf(m, 0, 1) < p) { lo = m; } else { hi = m; } } return (lo + hi) / 2; }

Update {
  if (abs(d - dp) > 0.000001) { P.pos.x = 16 * d - 8; P.pos.y = ya; }
  if (abs(d - dp) <= 0.000001) { if (abs(P.pos.x - pp) > 0.000001) { d = (P.pos.x + 8) / 16; } }
  dp = d; pp = P.pos.x;
  dl = d * sqrt(n); cc = qn(1 - al);
  float cx = 2 * cc;
  if (key != round(al * 1000) + dl * 100000) {
    gb = newGraph(); ga = newGraph(); gw = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    repeat (9) {
      float tx = -8 + 2 * i;
      addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0));
    }
    repeat (200) {
      float x = -9.95 + 0.1 * i; string id = format(i, 0);
      if (x >= cx) {
        addNode(gb, "a" + id, [x, y0]); addNode(gb, "b" + id, [x, h1(x)]); addEdge(gb, "a" + id, "b" + id, 1, "#22c55e");
        addNode(gb, "c" + id, [x, y0]); addNode(gb, "d" + id, [x, h0(x)]); addEdge(gb, "c" + id, "d" + id, 1, "#f59e0b");
      }
    }
    key = round(al * 1000) + dl * 100000;
  }
  float pw = 1 - normalCdf(cc - dl, 0, 1);
  if (tab == 2 && k3 != al * 1000 + d * 100000 + n * 10000000) {
    k3 = al * 1000 + d * 100000 + n * 10000000;
    // оси и опорные уровни: 0, 0.5, 1 по вертикали; α (мощность при μ₁ = μ₀) и 0.8
    gw = newGraph();
    addNode(gw, "l", [-10, ya]); addNode(gw, "r", [10, ya]); addEdge(gw, "l", "r");
    addNode(gw, "v0", [-8, ya]); addNode(gw, "v1", [-8, ya + 8.5]); addEdge(gw, "v0", "v1");
    addNode(gw, "h1", [-10, ya + 8.5]); addNode(gw, "h2", [10, ya + 8.5]); addEdge(gw, "h1", "h2");
    addNode(gw, "h3", [-10, ya + 6.8]); addNode(gw, "h4", [10, ya + 6.8]); addEdge(gw, "h3", "h4");
    addNode(gw, "h5", [-10, ya + 8.5 * al]); addNode(gw, "h6", [10, ya + 8.5 * al]); addEdge(gw, "h5", "h6");
    M.pos.x = 16 * d - 8; M.pos.y = ya + 8.5 * pw;
  }
  if (tab == 1) {
    info = "**Статистическая мощность критерия** — вероятность отвергнуть нулевую гипотезу H₀, когда верна конкретная альтернатива: 1 − β = P(Z ≥ c | H₁) (зелёная область под кривой H₁ правее порога c). Оранжевая область под кривой H₀ — уровень значимости α = P(Z ≥ c | H₀).\n\n";
    info = info + "Сейчас δ = " + format(d, 2) + "·√" + format(n, 0) + " = **" + format(dl, 2) + "**, α = **" + format(al, 2) + "**, c = " + format(cc, 2) + ": мощность **" + format(pw, 4) + "**, β = " + format(1 - pw, 4) + ".\n\n";
    info = info + "Мощность растёт с удалением H₁ от H₀ и с ростом n (кривая H₁ уезжает вправо); расширение критической области (больше α) тоже повышает мощность, но ценой роста α. При μ₁ = μ₀ мощность равна α.";
  }
  if (tab == 2) {
    info = "**Мощность как функция альтернативы.** При n = " + format(n, 0) + " и α = " + format(al, 2) + " мощность критерия 1 − β = Φ(δ − c), δ = (μ₁ − μ₀)√n / σ, монотонно растёт от α (при μ₁ = μ₀) к 1 по мере удаления μ₁ от μ₀ вправо.\n\n";
    info = info + "При μ₁ − μ₀ = **" + format(d, 2) + "** σ мощность равна **" + format(pw, 4) + "**";
    if (pw >= 0.8) { info = info + " — не меньше привычного ориентира 0.8 (серые линии — уровни 1 и 0.8)."; }
    if (pw < 0.8) { info = info + " — меньше привычного ориентира 0.8: такое отклонение критерий чаще пропускает (β = " + format(1 - pw, 4) + ")."; }
  }
}
]
