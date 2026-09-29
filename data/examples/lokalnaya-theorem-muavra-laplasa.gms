[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- По оси x — нормированное отклонение x = (k − np)/σ, σ = √(npq). Столбики — σ · Pₙ(k), то есть биномиальная
// вероятность в масштабе плотности; оранжевая кривая — стандартная нормальная плотность φ(x). Зелёный столбик — выбранное k. ----
float n = 50; float p = 0.4; float x = 1; float k = 0; float sig = 3;
string key = ""; string info = "";

draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gB0"; graph = "gb"; edgeCap = butt; edgeWidth = 73; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5; active = sig >= 0 && sig < 1.4 }
draw Graph { name = "gB1"; graph = "gb"; edgeCap = butt; edgeWidth = 50; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5; active = sig >= 1.4 && sig < 2 }
draw Graph { name = "gB2"; graph = "gb"; edgeCap = butt; edgeWidth = 31; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5; active = sig >= 2 && sig < 3 }
draw Graph { name = "gB3"; graph = "gb"; edgeCap = butt; edgeWidth = 19; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5; active = sig >= 3 && sig < 5 }
draw Graph { name = "gB4"; graph = "gb"; edgeCap = butt; edgeWidth = 11; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5; active = sig >= 5 && sig < 8 }
draw Graph { name = "gB5"; graph = "gb"; edgeCap = butt; edgeWidth = 6.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5; active = sig >= 8 && sig < 13 }
draw Graph { name = "gB6"; graph = "gb"; edgeCap = butt; edgeWidth = 4.4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5; active = sig >= 13 && sig < 1000 }
draw Graph { name = "gPh"; graph = "gph"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gPt"; graph = "gpt"; nodeColor = #22c55e; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Text { name = "ty1"; pos = (-7.15, -1.933); text = "0.1"; size = 0.75; align = right }
draw Text { name = "ty2"; pos = (-7.15, -0.267); text = "0.2"; size = 0.75; align = right }
draw Text { name = "ty3"; pos = (-7.15, 1.400); text = "0.3"; size = 0.75; align = right }
draw Text { name = "ty4"; pos = (-7.15, 3.067); text = "0.4"; size = 0.75; align = right }
draw Text { name = "tx0"; pos = (-6.200, -4.15); text = "−4"; size = 0.75 }
draw Text { name = "tx1"; pos = (-4.650, -4.15); text = "−3"; size = 0.75 }
draw Text { name = "tx2"; pos = (-3.100, -4.15); text = "−2"; size = 0.75 }
draw Text { name = "tx3"; pos = (-1.550, -4.15); text = "−1"; size = 0.75 }
draw Text { name = "tx4"; pos = (0.000, -4.15); text = "0"; size = 0.75 }
draw Text { name = "tx5"; pos = (1.550, -4.15); text = "1"; size = 0.75 }
draw Text { name = "tx6"; pos = (3.100, -4.15); text = "2"; size = 0.75 }
draw Text { name = "tx7"; pos = (4.650, -4.15); text = "3"; size = 0.75 }
draw Text { name = "tx8"; pos = (6.200, -4.15); text = "4"; size = 0.75 }
draw Text { name = "tCap"; pos = (-7.15, 4.5); text = "σ · Pₙ(k)  и  φ(x)"; size = 0.85; align = left }
draw Text { name = "tX"; pos = (7.9, -4.75); text = "x = (k − np)/σ"; size = 0.85; align = right }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 10; max = 400; step = 1; default = 50 }
new UI { name = "sP"; type = slider; label = "p"; variable = p; min = 0.1; max = 0.9; step = 0.05; default = 0.4 }
new UI { name = "sX"; type = slider; label = "x"; variable = x; min = -4; max = 4; step = 0.05; default = 1 }

Function px(u) { return 1.55 * u; }
Function py(v) { return -3.6 + 16.6667 * v; }
Function phi(u) { return exp(-u * u / 2) / 2.5066282746310002; }
Function lc(m, j) { float s = 0; repeat (j) { s = s + log((m - i) / (i + 1)); } return s; }
Function pk(m, j) { return exp(lc(m, j) + j * log(p) + (m - j) * log(1 - p)); }
Function sg(v, d) { if (v < -0.5 * pow(10, -d)) { return "−" + format(-v, d); } return format(abs(v), d); }

Update {
  sig = sqrt(n * p * (1 - p));
  k = round(n * p + x * sig); if (k < 0) { k = 0; } if (k > n) { k = n; }
  string kk = format(n, 0) + "|" + format(p, 2) + "|" + format(k, 0);
  if (kk != key) {
    key = kk;
    gb = newGraph(); gg = newGraph(); gph = newGraph(); gpt = newGraph();
    repeat (5) { addNode(gg, "a" + format(i, 0), [px(-4.5), py(0.1 * i)]); addNode(gg, "b" + format(i, 0), [px(4.5), py(0.1 * i)]); addEdge(gg, "a" + format(i, 0), "b" + format(i, 0)); }
    repeat (91) { float u = -4.5 + 0.1 * i; addNode(gph, "c" + format(i, 0), [px(u), py(phi(u))]); if (i > 0) { addEdge(gph, "c" + format(i - 1, 0), "c" + format(i, 0)); } }
    float lo = max(0, floor(n * p - 4.6 * sig)); float hi = min(n, ceil(n * p + 4.6 * sig));
    repeat (hi - lo + 1) {
      float j = lo + i; float u = (j - n * p) / sig;
      string c = "#3b82f6"; if (j == k) { c = "#22c55e"; }
      addNode(gb, "p" + format(j, 0), [px(u), py(0)]); addNode(gb, "q" + format(j, 0), [px(u), py(sig * pk(n, j))]); addEdge(gb, "p" + format(j, 0), "q" + format(j, 0), 1, c);
    }
    float uk = (k - n * p) / sig; addNode(gpt, "m", [px(uk), py(phi(uk))]);
  }
  float uk = (k - n * p) / sig; float ex = pk(n, k); float ap = phi(uk) / sig;
  string s = "**Локальная теорема Муавра — Лапласа:** при большом n и ограниченном отклонении |x| ≤ C, x = (k − np)/σ, вероятность Pₙ(k) ≈ φ(x) / σ, где σ = √(npq), φ(x) = exp(−x²/2) / √(2π).\n\n";
  s = s + "Здесь n = " + format(n, 0) + ", p = " + format(p, 2) + ", np = " + format(n * p, 2) + ", σ = " + format(sig, 3) + ". Выбрано k = " + format(k, 0) + ", x = " + sg(uk, 3) + ": точное Pₙ(k) = " + format(ex, 5) + ", формула φ(x)/σ = " + format(ap, 5) + ", относительная погрешность " + sg(100 * (ap - ex) / ex, 2) + "%.";
  if (abs(uk) > 3) { s = s + "\n\nПри |x| > 3 вероятности уже очень малы, а относительная погрешность формулы растёт: вне зоны ограниченных отклонений она перестаёт быть достоверной."; }
  else { s = s + "\n\nСо ростом n столбики ложатся на кривую φ(x) всё плотнее, а при p, далёком от ½, для этого нужно больше испытаний."; }
  info = s;
}
]
