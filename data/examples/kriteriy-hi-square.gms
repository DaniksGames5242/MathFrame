[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Слева — наблюдённые частоты Oᵢ по k категориям (перетаскиваются вершины столбиков) и ожидаемая частота
// E = N/k при нулевой гипотезе о равномерности (жёлтая линия). Справа — плотность χ² с k − 1 степенями свободы
// (ось: x = 1 + 0.4·χ²); синяя линия — статистика χ² = Σ (Oᵢ − E)²/E, закрашен хвост, жёлтая засечка — критическое значение. ----
float y0 = -4.5; float k = 6; float ky2 = 40; float df = 5;
float N = 60; float E = 10; float chi = 0; float pv = 1; float cc = 11.07;
float kk = -99;
string info = "";

func dens(X) = y0 + ky2 * chi2Pdf((X - 1) / 0.4, df);
draw Function { name = "gd"; f = "dens"; xmin = 1.05; xmax = 10; thickness = 3; layer = 30 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 34; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gT"; graph = "gt"; nodeRadius = 0; edgeWidth = 4.2; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f677; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "gc"; nodeRadius = 0; edgeWidth = 2.5; labels = false; interactive = false; showWeights = false; layer = 40 }
new Point { name = "P0"; pos = (-8.75, -2.9); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6; active = k > 0.5 }
new Point { name = "P1"; pos = (-7.25, -1.6999999999999997); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6; active = k > 1.5 }
new Point { name = "P2"; pos = (-5.75, -2.7); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6; active = k > 2.5 }
new Point { name = "P3"; pos = (-4.25, -2.0999999999999996); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6; active = k > 3.5 }
new Point { name = "P4"; pos = (-2.75, -3.0999999999999996); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6; active = k > 4.5 }
new Point { name = "P5"; pos = (-1.25, -2.5); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6; active = k > 5.5 }
draw Text { name = "L0"; pos = (-8.75, y0 - 0.55); text = "1"; size = 0.8; active = k > 0.5 }
draw Text { name = "L1"; pos = (-7.25, y0 - 0.55); text = "2"; size = 0.8; active = k > 1.5 }
draw Text { name = "L2"; pos = (-5.75, y0 - 0.55); text = "3"; size = 0.8; active = k > 2.5 }
draw Text { name = "L3"; pos = (-4.25, y0 - 0.55); text = "4"; size = 0.8; active = k > 3.5 }
draw Text { name = "L4"; pos = (-2.75, y0 - 0.55); text = "5"; size = 0.8; active = k > 4.5 }
draw Text { name = "L5"; pos = (-1.25, y0 - 0.55); text = "6"; size = 0.8; active = k > 5.5 }
draw Text { name = "x0"; pos = (1, y0 - 0.55); text = "0"; size = 0.7 }
draw Text { name = "x1"; pos = (5, y0 - 0.55); text = "10"; size = 0.7 }
draw Text { name = "x2"; pos = (9, y0 - 0.55); text = "20"; size = 0.7 }
draw Text { name = "tE"; pos = (-9.6, y0 + 0.2 * E + 0.5); text = "E"; size = 0.9; color = #f59e0b; align = left }

new UI { type = slider; label = "число категорий k"; variable = k; min = 3; max = 6; step = 1; default = 6 }

Function cnt(j) {
  if (j == 0) { return round((P0.pos.y - y0) / 0.2); }
  if (j == 1) { return round((P1.pos.y - y0) / 0.2); }
  if (j == 2) { return round((P2.pos.y - y0) / 0.2); }
  if (j == 3) { return round((P3.pos.y - y0) / 0.2); }
  if (j == 4) { return round((P4.pos.y - y0) / 0.2); }
  if (j == 5) { return round((P5.pos.y - y0) / 0.2); }
  return 0;
}
Update {
  if (k > 0.5) { float o0 = max(0, min(40, round((P0.pos.y - y0) / 0.2))); if (abs(P0.pos.y - (y0 + 0.2 * o0)) > 0.0001) { P0.pos.y = y0 + 0.2 * o0; } if (abs(P0.pos.x - (-8.75)) > 0.0001) { P0.pos.x = -8.75; } }
  if (k > 1.5) { float o1 = max(0, min(40, round((P1.pos.y - y0) / 0.2))); if (abs(P1.pos.y - (y0 + 0.2 * o1)) > 0.0001) { P1.pos.y = y0 + 0.2 * o1; } if (abs(P1.pos.x - (-7.25)) > 0.0001) { P1.pos.x = -7.25; } }
  if (k > 2.5) { float o2 = max(0, min(40, round((P2.pos.y - y0) / 0.2))); if (abs(P2.pos.y - (y0 + 0.2 * o2)) > 0.0001) { P2.pos.y = y0 + 0.2 * o2; } if (abs(P2.pos.x - (-5.75)) > 0.0001) { P2.pos.x = -5.75; } }
  if (k > 3.5) { float o3 = max(0, min(40, round((P3.pos.y - y0) / 0.2))); if (abs(P3.pos.y - (y0 + 0.2 * o3)) > 0.0001) { P3.pos.y = y0 + 0.2 * o3; } if (abs(P3.pos.x - (-4.25)) > 0.0001) { P3.pos.x = -4.25; } }
  if (k > 4.5) { float o4 = max(0, min(40, round((P4.pos.y - y0) / 0.2))); if (abs(P4.pos.y - (y0 + 0.2 * o4)) > 0.0001) { P4.pos.y = y0 + 0.2 * o4; } if (abs(P4.pos.x - (-2.75)) > 0.0001) { P4.pos.x = -2.75; } }
  if (k > 5.5) { float o5 = max(0, min(40, round((P5.pos.y - y0) / 0.2))); if (abs(P5.pos.y - (y0 + 0.2 * o5)) > 0.0001) { P5.pos.y = y0 + 0.2 * o5; } if (abs(P5.pos.x - (-1.25)) > 0.0001) { P5.pos.x = -1.25; } }
  N = 0; repeat (k) { N = N + cnt(i); }
  E = max(N / k, 0.0001);
  chi = 0; repeat (k) { chi = chi + (cnt(i) - E) * (cnt(i) - E) / E; }
  df = k - 1;
  float key = 0; repeat (k) { key = key * 1.9 + cnt(i); } key = key + 100000 * k;
  if (kk != key) {
    gb = newGraph(); gt = newGraph(); ga = newGraph(); gc = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    repeat (6) { float tx = 1 + 4 * i; addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0)); }
    repeat (k) { float bx = -8.75 + 1.5 * i; addNode(gb, "a" + format(i, 0), [bx, y0]); addNode(gb, "b" + format(i, 0), [bx, y0 + 0.2 * cnt(i)]); addEdge(gb, "a" + format(i, 0), "b" + format(i, 0), 1, "#3b82f6"); }
    addNode(gc, "e1", [-9.6, y0 + 0.2 * E]); addNode(gc, "e2", [-8.75 + 1.5 * (k - 1) + 0.85, y0 + 0.2 * E]); addEdge(gc, "e1", "e2", 1, "#f59e0b");
    float pk = chi2Pdf(max(df - 2, 0.05), df); ky2 = 6 / pk;
    repeat (85) {
      float x = 1.05 + 0.1 * i; string id = format(i, 0);
      if ((x - 1) / 0.4 >= chi) { addNode(gt, "a" + id, [x, y0]); addNode(gt, "b" + id, [x, dens(x)]); addEdge(gt, "a" + id, "b" + id, 1, "#3b82f6"); }
    }
    cc = chi2Quantile(0.95, df);
    float cx = 1 + 0.4 * cc; addNode(gc, "c1", [cx, y0 - 0.4]); addNode(gc, "c2", [cx, y0 + 0.4]); addEdge(gc, "c1", "c2", 1, "#f59e0b");
    float mx = 1 + 0.4 * min(chi, 21); addNode(gc, "m1", [mx, y0]); addNode(gc, "m2", [mx, y0 + 7]); addEdge(gc, "m1", "m2", 1, "#3b82f6");
    kk = key;
  }
  pv = 1 - chi2Cdf(chi, df);
  info = "**Критерий хи-квадрат (согласия)** сравнивает наблюдённые частоты Oᵢ с ожидаемыми Eᵢ при H₀: все k = **" + format(k, 0) + "** категорий равновероятны. N = **" + format(N, 0) + "**, E = N/k = **" + format(E, 2) + "**.\n\n";
  info = info + "**χ² = Σ (Oᵢ − Eᵢ)² / Eᵢ = " + format(chi, 2) + "**; при H₀ и большом N статистика приближённо имеет распределение χ² с k − 1 = **" + format(df, 0) + "** степенями свободы. p = 1 − F(χ²) = **" + format(pv, 4) + "**; критическое значение при α = 0.05: **" + format(cc, 2) + "**.\n\n";
  if (N < 1) { info = info + "Наблюдений нет — проверять нечего."; }
  if (N >= 1) { if (chi >= cc) { info = info + "χ² ≥ " + format(cc, 2) + ": H₀ **отвергается**."; } if (chi < cc) { info = info + "χ² < " + format(cc, 2) + ": H₀ **не отвергается**."; } }
  if (N >= 1) { if (E < 5) { info = info + " Ожидаемые частоты меньше 5 — приближение распределением χ² ненадёжно (критерий асимптотический)."; } }
}
]
