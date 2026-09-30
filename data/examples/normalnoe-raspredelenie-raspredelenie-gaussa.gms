[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Плотность N(μ; σ²). Верхняя точка — вершина колокола (двигает μ), боковая — точка перегиба x = μ + σ (двигает σ).
// Заливка: |x − μ| < σ (синяя), < 2σ (жёлтая), < 3σ (зелёная). ----
func nf(x) = -5 + 20 * exp(-(x - mu) * (x - mu) / (2 * sg * sg)) / (sg * 2.5066283);
draw Function { name = "gr"; f = "nf"; xmin = -10; xmax = 10; thickness = 3; layer = 6 }
draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gF"; graph = "gf"; edgeWidth = 5; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
new Point { name = "L0"; pos = (-9.8, -5); dynamic = false; collision = false; active = false }
new Point { name = "L1"; pos = (9.8, -5); dynamic = false; collision = false; active = false }
new Line { name = "ax"; pos = (L0, L1); thickness = 1.5; interact = false; layer = 4 }
new Point { name = "PM"; pos = (1, 0); pauseOnDrag = false; collideWithPoints = false; layer = 50 }
new Point { name = "QS"; pos = (2.5, -1); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b; layer = 50 }
draw Text { name = "tmu"; pos = (mu, -5.6); text = "μ"; size = 0.95 }
draw Text { name = "tm1"; pos = (mu - sg, -5.6); text = "μ − σ"; size = 0.85 }
draw Text { name = "tp1"; pos = (mu + sg, -5.6); text = "μ + σ"; size = 0.85 }
draw Text { name = "tf"; pos = (-9.6, 5.5); text = "f(x)"; size = 1; align = left }

// ---- Логика ----
float mu = 1; float sg = 1.5; float ready = 0; float key = -1;
float pmx = 0; float pmy = 0; float qsx = 0; float qsy = 0;
string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function hy(x) { return -5 + 20 * exp(-(x - mu) * (x - mu) / (2 * sg * sg)) / (sg * 2.5066283); }

Update {
  if (ready == 1) {
    if (abs(PM.pos.x - pmx) + abs(PM.pos.y - pmy) > 0.000001) { mu = min(6, max(-6, PM.pos.x)); }
    else { if (abs(QS.pos.x - qsx) + abs(QS.pos.y - qsy) > 0.000001) { sg = min(3, max(1, QS.pos.x - mu)); } }
  }
  ready = 1;
  float wx = mu; float wy = hy(mu);
  if (abs(PM.pos.x - wx) > 0.000001) { PM.pos.x = wx; }
  if (abs(PM.pos.y - wy) > 0.000001) { PM.pos.y = wy; }
  wx = mu + sg; wy = hy(mu + sg);
  if (abs(QS.pos.x - wx) > 0.000001) { QS.pos.x = wx; }
  if (abs(QS.pos.y - wy) > 0.000001) { QS.pos.y = wy; }
  pmx = PM.pos.x; pmy = PM.pos.y; qsx = QS.pos.x; qsy = QS.pos.y;
  if (key != mu * 100 + sg * 100000) {
    gg = newGraph(); gf = newGraph();
    addNode(gg, "a1", [mu, -5]); addNode(gg, "a2", [mu, 5.4]); addEdge(gg, "a1", "a2");
    repeat (round(6 * sg / 0.12) + 1) {
      float x = mu - 3 * sg + 0.12 * i;
      string c = "#22c55e"; if (abs(x - mu) < 2 * sg) { c = "#f59e0b"; } if (abs(x - mu) < sg) { c = "#3b82f6"; }
      if (x > -9.9 && x < 9.9) { addNode(gf, "u" + format(i, 0), [x, -5]); addNode(gf, "v" + format(i, 0), [x, hy(x)]); addEdge(gf, "u" + format(i, 0), "v" + format(i, 0), 1, c); }
    }
    info = "**Нормальное распределение N(μ; σ²):** μ = " + num(mu, 2) + " — параметр сдвига, σ = " + format(sg, 2) + " — параметр масштаба. Плотность f(x) = 1/(σ√(2π))·e^(−(x − μ)²/(2σ²)) симметрична относительно μ и достигает максимума f(μ) = " + format(1 / (sg * 2.5066283), 3) + " в этой точке: **медиана, мода и математическое ожидание совпадают с μ**. Меньше σ — острее и уже колокол, больше — площадь растекается.\n\n**E[X] = μ = " + num(mu, 2) + ", D[X] = σ² = " + format(sg * sg, 2) + ".** Точки перегиба — x = μ ± σ = " + num(mu - sg, 2) + " и " + num(mu + sg, 2) + ".\n\n**Хвосты убывают экспоненциально быстро:** на отрезок μ ± σ приходится 68.3 % вероятности (синяя часть), на μ ± 2σ — 95.4 %, на μ ± 3σ — 99.7 % при любых μ и σ. Верхняя точка двигает μ, боковая — σ.";
    key = mu * 100 + sg * 100000;
  }
}
]
