[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Проверка H₀: μ = 0 при известной σ; статистика Z ~ N(0; 1) при H₀ и N(δ; 1) при верной H₁, δ = μ₁√n / σ.
// Вид альтернативы (≠, >, <) задаёт, какие значения μ₁ допустимы и где критическая область (оранжевая, α = 0.05). ----
float y0 = -4; string alt = "two"; float dl = 2; float key = -1; string info = "";

func h0(x) = y0 + 7.5 * exp(-x * x / 8);
func h1(x) = y0 + 7.5 * exp(-(x - 2 * dl) * (x - 2 * dl) / 8);
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
draw Text { name = "h0l"; pos = (0, y0 + 8.6); text = "H₀"; size = 1 }
draw Text { name = "h1l"; pos = (2 * dl, y0 + 8.6); text = "H₁"; size = 1; color = #22c55e; active = abs(dl) > 0.8 }

new Point { name = "L1"; pos = (-7, y0); dynamic = false; active = false }
new Point { name = "L2"; pos = (7, y0); dynamic = false; active = false }
new Line { name = "axisLine"; pos = (L1, L2); active = false; interact = false }
new Point { name = "M"; line = "axisLine"; t = 0.79; pauseOnDrag = false; collideWithPoints = false; color = #22c55e }
new UI { type = select; label = "альтернатива"; variable = alt; options = ("two", "right", "left"); labels = ("H₁: μ ≠ 0", "H₁: μ > 0", "H₁: μ < 0"); default = "two" }

Update {
  float mx = M.pos.x;
  if (alt == "right") { if (mx < 0.6) { M.pos.x = 0.6; M.pos.y = y0; mx = 0.6; } }
  if (alt == "left") { if (mx > -0.6) { M.pos.x = -0.6; M.pos.y = y0; mx = -0.6; } }
  if (alt == "two") { if (abs(mx) < 0.6) { M.pos.x = 0.6; M.pos.y = y0; mx = 0.6; } }
  dl = mx / 2;
  if (key != alt + round(dl * 1000)) {
    gb = newGraph(); ga = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    repeat (9) {
      float tx = -8 + 2 * i;
      addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0));
    }
    repeat (200) {
      float x = -9.95 + 0.1 * i; string id = format(i, 0); float on = 0;
      if (alt == "two") { if (abs(x) >= 3.92) { on = 1; } }
      if (alt == "right") { if (x >= 3.29) { on = 1; } }
      if (alt == "left") { if (x <= -3.29) { on = 1; } }
      if (on > 0.5) { addNode(gb, "a" + id, [x, y0]); addNode(gb, "b" + id, [x, h0(x)]); addEdge(gb, "a" + id, "b" + id, 1, "#f59e0b"); }
    }
    key = alt + round(dl * 1000);
  }
  float pw = 0;
  if (alt == "two") { pw = normalCdf(dl - 1.96, 0, 1) + normalCdf(-dl - 1.96, 0, 1); }
  if (alt == "right") { pw = 1 - normalCdf(1.645 - dl, 0, 1); }
  if (alt == "left") { pw = normalCdf(-1.645 - dl, 0, 1); }
  string ha = "μ ≠ 0"; string sh = "по обе стороны от 0: критическая область состоит из двух хвостов |Z| ≥ 1.96";
  if (alt == "right") { ha = "μ > 0"; sh = "только вправо: критическая область — правый хвост Z ≥ 1.645"; }
  if (alt == "left") { ha = "μ < 0"; sh = "только влево: критическая область — левый хвост Z ≤ −1.645"; }
  string sg = ""; if (dl < 0) { sg = "−"; }
  info = "**Альтернативная гипотеза H₁: " + ha + "** — предположение, против которого проверяется нулевая гипотеза H₀: μ = 0. Множества значений параметра под H₀ и под H₁ не пересекаются, а форма H₁ задаёт направление, в котором ищется отклонение: здесь " + sh + " (оранжевая область, α = 0.05).\n\n";
  info = info + "Пусть на самом деле верна H₁ и Z ~ N(δ; 1), δ = μ₁√n / σ = **" + sg + format(abs(dl), 2) + "** (зелёная кривая). Тогда H₀ отвергается с вероятностью — мощностью критерия — **" + format(pw, 4) + "**.\n\n";
  info = info + "Односторонняя H₁ допускает только значения μ₁ по свою сторону от 0; при двусторонней H₁ отклонение может быть в любую сторону, и критерий чувствителен к обеим.";
}
]
