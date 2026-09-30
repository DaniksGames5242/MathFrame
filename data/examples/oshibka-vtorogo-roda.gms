[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Правосторонний критерий: отвергаем H₀ при Z ≥ c. При H₀ статистика Z ~ N(0; 1), при H₁ — N(δ; 1),
// δ = μ₁√n. Оранжевая область — α (ошибка первого рода), зелёная — β: Z < c при верной H₁. ----
float y0 = -4; float d = 0.5; float n = 4; float dl = 1; float key = -1; string info = "";

func h0(x) = y0 + 7.5 * exp(-x * x / 8);
func h1(x) = y0 + 7.5 * exp(-(x - 2 * dl) * (x - 2 * dl) / 8);
draw Function { name = "f0"; f = "h0"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Function { name = "f1"; f = "h1"; xmin = -10; xmax = 10; thickness = 3; color = #22c55e; layer = 30 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 4.2; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f677; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "x4"; pos = (-8, y0 - 0.6); text = "−4"; size = 0.7 }
draw Text { name = "x2"; pos = (-4, y0 - 0.6); text = "−2"; size = 0.7 }
draw Text { name = "x0"; pos = (0, y0 - 0.6); text = "0"; size = 0.7 }
draw Text { name = "y2"; pos = (4, y0 - 0.6); text = "2"; size = 0.7 }
draw Text { name = "y4"; pos = (8, y0 - 0.6); text = "4"; size = 0.7 }
draw Text { name = "zl"; pos = (9.6, y0 + 0.6); text = "Z"; size = 0.9 }
draw Text { name = "h0l"; pos = (-2.6, y0 + 5.6); text = "H₀"; size = 1 }
draw Text { name = "h1l"; pos = (2 * dl + 2.6, y0 + 5.6); text = "H₁"; size = 1; color = #22c55e }
draw Text { name = "cl"; pos = (C.pos.x, y0 + 0.9); text = "c"; size = 0.9 }

new Point { name = "L1"; pos = (0.6, y0); dynamic = false; active = false }
new Point { name = "L2"; pos = (7, y0); dynamic = false; active = false }
new Line { name = "axisLine"; pos = (L1, L2); active = false; interact = false }
new Point { name = "C"; line = "axisLine"; t = 0.42; pauseOnDrag = false; collideWithPoints = false }
new UI { type = slider; label = "μ₁ − μ₀ (в σ)"; variable = d; min = 0.1; max = 1; step = 0.05; default = 0.5 }
new UI { type = slider; label = "объём выборки n"; variable = n; min = 1; max = 12; step = 1; default = 4 }

Update {
  dl = d * sqrt(n);
  float cx = C.pos.x; float c = cx / 2;
  if (key != round(cx * 1000) + dl * 1000000) {
    gb = newGraph(); ga = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    repeat (9) {
      float tx = -8 + 2 * i;
      addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0));
    }
    repeat (200) {
      float x = -9.95 + 0.1 * i; string id = format(i, 0);
      if (x >= cx) { addNode(gb, "a" + id, [x, y0]); addNode(gb, "b" + id, [x, h0(x)]); addEdge(gb, "a" + id, "b" + id, 1, "#f59e0b"); }
      if (x < cx) { addNode(gb, "c" + id, [x, y0]); addNode(gb, "d" + id, [x, h1(x)]); addEdge(gb, "c" + id, "d" + id, 1, "#22c55e"); }
    }
    key = round(cx * 1000) + dl * 1000000;
  }
  float alpha = 1 - normalCdf(c, 0, 1); float beta = normalCdf(c - dl, 0, 1);
  info = "**Ошибка второго рода** — принять нулевую гипотезу H₀, когда верна альтернатива H₁ (правосторонняя проверка H₀: μ = μ₀ против H₁: μ = μ₁ > μ₀, σ известна). Критерий отвергает H₀ при Z ≥ c, поэтому промах происходит при Z < c, когда верна H₁: β = P(Z < c | H₁) = Φ(c − δ), где Z при H₁ распределена как N(δ; 1), δ = (μ₁ − μ₀)√n / σ.\n\n";
  info = info + "Сейчас δ = " + format(d, 2) + "·√" + format(n, 0) + " = **" + format(dl, 2) + "**, c = **" + format(c, 2) + "**: β = **" + format(beta, 4) + "** (зелёная область); для сравнения α = " + format(alpha, 4) + " (оранжевая область), 1 − β = " + format(1 - beta, 4) + ".\n\n";
  info = info + "Чем ближе H₁ к H₀ (меньше δ), тем сильнее перекрываются кривые и тем больше β; сдвиг c вправо уменьшает α, но увеличивает β.";
}
]
