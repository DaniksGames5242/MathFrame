[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Сверху — члены ряда aₙ (столбики), снизу — частичные суммы Sₙ = a₁ + … + aₙ.
// Для гармонического ряда члены раскрашены блоками 1/2, 1/3 + 1/4, 1/5 + … + 1/8, …:
// сумма каждого блока не меньше ½. ----
draw Graph { name = "gT"; graph = "gt"; edgeWidth = 5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gS"; graph = "gs"; nodeColor = #22c55e; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #6b7280; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "l1"; pos = (-7.6, 4.4); text = "члены aₙ"; size = 0.95; align = left }
draw Text { name = "l2"; pos = (-7.6, 0.2); text = "частичные суммы Sₙ"; size = 0.95; align = left }
draw Text { name = "l3"; pos = (7.6, 0.2); text = "S = " + format(Sn, 3); size = 0.95; align = right; color = #22c55e }

new UI { name = "sS"; type = select; label = "ряд"; variable = sr; options = ("harm", "sq", "rt", "frac", "alt"); labels = ("Σ 1/n", "Σ 1/n²", "Σ 1/√n", "Σ n/(n + 1)", "Σ (−1)ⁿ"); default = "harm" }
new UI { name = "sN"; type = slider; label = "членов"; variable = N; min = 4; max = 128; step = 1; default = 64 }

// ---- Логика ----
string sr = "harm"; float N = 64;
float key = -1; float Sn = 0;
string info = "";

Function a(n) {
  if (sr == "harm") { return 1 / n; }
  if (sr == "sq") { return 1 / (n * n); }
  if (sr == "rt") { return 1 / sqrt(n); }
  if (sr == "frac") { return n / (n + 1); }
  if (n - 2 * floor(n / 2) == 0) { return 1; } return -1;
}
Function px(n) { return -7.4 + 14.8 * (n - 0.5) / N; }
// номер блока 2^(k−1) < n ≤ 2^k
Function blk(n) { float k = 0; repeat (10) { if (pow(2, k) < n) { k = k + 1; } } return k; }

Update {
  float sc = 0; if (sr == "sq") { sc = 1; } if (sr == "rt") { sc = 2; } if (sr == "frac") { sc = 3; } if (sr == "alt") { sc = 4; }
  if (key != N * 10 + sc) {
    gt = newGraph(); gs = newGraph(); gx = newGraph();
    // масштабы: члены — к 1, суммы — к максимуму |S|
    // масштаб сумм — по 128 членам, чтобы при изменении N был виден рост
    float smax = 0; float smin = 0; float s = 0; repeat (128) { s = s + a(i + 1); smax = max(smax, s); smin = min(smin, s); }
    float sy = 3.6 / (smax - smin);
    addNode(gx, "a1", [-7.5, 1.2]); addNode(gx, "a2", [7.5, 1.2]); addEdge(gx, "a1", "a2");
    addNode(gx, "b1", [-7.5, -4.2 - sy * smin]); addNode(gx, "b2", [7.5, -4.2 - sy * smin]); addEdge(gx, "b1", "b2");
    s = 0;
    repeat (N) {
      float n = i + 1; float v = a(n); s = s + v;
      string c = "#3b82f6";
      if (sr == "harm") { if (blk(n) - 2 * floor(blk(n) / 2) == 1) { c = "#f59e0b"; } }
      addNode(gt, "p" + format(n, 0), [px(n), 1.2]); addNode(gt, "q" + format(n, 0), [px(n), 1.2 + 2.9 * v]); addEdge(gt, "p" + format(n, 0), "q" + format(n, 0), 1, c);
      addNode(gs, "s" + format(n, 0), [px(n), -4.2 + sy * (s - smin)]);
    }
    Sn = s;
    key = N * 10 + sc;
  }
  info = "**Необходимый признак сходимости ряда:** если ряд Σ aₙ сходится, то aₙ → 0 (ведь aₙ = Sₙ − Sₙ₋₁, а оба слагаемых стремятся к одной сумме S). Поэтому ряд, члены которого не стремятся к нулю, заведомо расходится. Но признак только **необходимый**: aₙ → 0 ещё не гарантирует сходимости.\n\n";
  if (sr == "harm") { info = info + "**Σ 1/n:** члены стремятся к 0, а ряд расходится: блоки 1/2, 1/3 + 1/4, 1/5 + … + 1/8, … (разного цвета) каждый больше или равен ½, и частичные суммы растут без ограничения — как ln n."; }
  if (sr == "sq") { info = info + "**Σ 1/n²:** члены стремятся к 0 достаточно быстро — ряд сходится к π²/6 ≈ 1,645."; }
  if (sr == "rt") { info = info + "**Σ 1/√n:** члены стремятся к 0, но медленнее, чем 1/n, — ряд расходится ещё быстрее гармонического."; }
  if (sr == "frac") { info = info + "**Σ n/(n + 1):** члены стремятся к 1, а не к 0 — необходимый признак не выполнен, ряд расходится."; }
  if (sr == "alt") { info = info + "**Σ (−1)ⁿ:** члены не стремятся к 0 — ряд расходится (частичные суммы колеблются между −1 и 0)."; }
}
]
