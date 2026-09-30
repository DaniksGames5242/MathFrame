[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Плотность f (кривая), вероятность интервала (c − h; c + h) — закрашенная площадь под ней.
// Точку c можно двигать по оси, полуширину h — ползунком. ----
draw Graph { name = "gAx"; graph = "gax"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gFill"; graph = "gfill"; edgeColor = #3b82f6; edgeWidth = 6; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gCur"; graph = "gcur"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gMk"; graph = "gmk"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Text { name = "lf"; pos = (-7.6, 4.4); text = "y = f(x)"; size = 1; align = left }
draw Text { name = "n1"; pos = (-6, -4.5); text = "−6"; size = 0.8 }
draw Text { name = "n2"; pos = (-3, -4.5); text = "−3"; size = 0.8 }
draw Text { name = "n3"; pos = (0, -4.5); text = "0"; size = 0.8 }
draw Text { name = "n4"; pos = (3, -4.5); text = "3"; size = 0.8 }
draw Text { name = "n5"; pos = (6, -4.5); text = "6"; size = 0.8 }
new Point { name = "C"; pos = (-1, -3.6); text = true("c"); pauseOnDrag = false; collision = false }

new UI { type = slider; label = "h"; variable = h; min = 0; max = 3; step = 0.05; default = 1 }

float h = 1; float key = -1; float pr = 0; float cx = -1; string info = ""; list Fc = [0];

Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function gauss(x, m, s) { return exp(-(x - m) * (x - m) / (2 * s * s)) / (s * 2.5066282746); }
Function dens(x) { return 0.7 * gauss(x, -1, 1.2) + 0.3 * gauss(x, 2.5, 0.9); }
Function cdf(x) {
  if (len(Fc) < 161) { return 0; } if (x <= -8) { return 0; } if (x >= 8) { return Fc[160]; }
  float u = (x + 8) * 10; float k = floor(u);
  return Fc[k] + (u - k) * (Fc[k + 1] - Fc[k]);
}
Function yy(x) { return -3.6 + 12 * dens(x); }

Start {
  repeat (160) { push(Fc, 0); }
  float s = 0; repeat (160) { s = s + 0.05 * (dens(-8 + i * 0.1) + dens(-7.9 + i * 0.1)); Fc[i + 1] = s; }
  gax = newGraph(); gcur = newGraph(); gfill = newGraph(); gmk = newGraph();
  addNode(gax, "a", [-8, -3.6]); addNode(gax, "b", [8, -3.6]); addEdge(gax, "a", "b");
  repeat (81) { addNode(gcur, "p" + format(i, 0), [-8 + i * 0.2, yy(-8 + i * 0.2)]); }
  repeat (80) { addEdge(gcur, "p" + format(i, 0), "p" + format(i + 1, 0)); }
}

Update {
  if (abs(C.pos.y + 3.6) > 0.0001) { C.pos.y = -3.6; }
  cx = C.pos.x;
  if (key != cx * 1000 + h + 100000 * len(Fc)) {
    gfill = newGraph(); gmk = newGraph();
    float lo = max(cx - h, -8); float hi = min(cx + h, 8);
    float n = floor((hi - lo) / 0.1);
    repeat (n) { float xx = lo + (i + 0.5) * 0.1; addNode(gfill, "u" + format(i, 0), [xx, -3.6]); addNode(gfill, "v" + format(i, 0), [xx, yy(xx)]); addEdge(gfill, "u" + format(i, 0), "v" + format(i, 0)); }
    addNode(gmk, "m", [cx, -3.6]); addNode(gmk, "n", [cx, yy(cx)]); addEdge(gmk, "m", "n");
    pr = cdf(cx + h) - cdf(cx - h);
    key = cx * 1000 + h + 100000 * len(Fc);
  }
  info = "**Непрерывная случайная величина** задаётся плотностью f: P(a < X < b) = ∫ f(x) dx по [a; b] — это площадь под графиком, а вся площадь равна " + format(cdf(8), 3) + ".\n\n";
  info = info + "Интервал (c − h; c + h), c = " + num(cx, 2) + ", h = " + num(h, 2) + ": P = F(c + h) − F(c − h) = " + format(pr, 4) + ".";
  if (h < 0.025) { info = info + "\n\nИнтервал стянулся в точку: **P(X = c) = 0**, хотя плотность в ней f(c) = " + format(dens(cx), 3) + " не равна нулю. Положительную вероятность имеет только интервал ненулевой длины."; }
  else { info = info + " Сужайте интервал: P стремится к нулю, а отношение P / (2h) = " + format(pr / (2 * h), 3) + " — к f(c) = " + format(dens(cx), 3) + "."; }
}
]
