[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Доказываем ∑ 1/k² < 2 оценкой: 1/k² < 1/(k−1) − 1/k (k ≥ 2).
// Сверху — частичные суммы Sₖ (зелёные) и оценка 2 − 1/k (жёлтые), снизу — слагаемые
// (синие) и их мажоранты (жёлтые). ----
float N = 10; float key = -1; string info = "";
draw Graph { name = "vB"; graph = "gB"; edgeColor = #3b82f6; edgeWidth = 9; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "vO"; graph = "gO"; edgeColor = #f59e0b; edgeWidth = 9; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "vS"; graph = "gS"; nodeColor = #22c55e; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 12 }
draw Graph { name = "vM"; graph = "gM"; nodeColor = #f59e0b; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 11 }
draw Graph { name = "vX"; graph = "gX"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "vL"; graph = "gL"; nodeRadius = 0; labels = true; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "t1"; pos = (-9.7, 5.75); text = "Sₖ и оценка 2 − 1/k"; size = 0.9; align = left }
draw Text { name = "t2"; pos = (-9.7, 2.6); text = "1/k² и мажоранта"; size = 0.9; align = left }
new UI { name = "sN"; type = slider; label = "n"; variable = N; min = 2; max = 20; step = 1; default = 10 }

Function px(k) { return -9.2 + 18.4 * (k - 0.5) / 20; }

Update {
  if (key != N) {
    gB = newGraph(); gO = newGraph(); gS = newGraph(); gM = newGraph(); gX = newGraph(); gL = newGraph();
    addNode(gX, "a", [-9.8, -4.5]); addNode(gX, "b", [9.8, -4.5]); addEdge(gX, "a", "b");
    addNode(gX, "c", [-9.8, 3.0]); addNode(gX, "d", [9.8, 3.0]); addEdge(gX, "c", "d");
    addNode(gX, "e1", [-9.8, 5.6]); addNode(gX, "e2", [9.8, 5.6]); addEdge(gX, "e1", "e2");
    float s = 0;
    repeat (N) {
      float k = i + 1; string ks = format(k, 0);
      s = s + 1 / (k * k);
      addNode(gB, "p" + ks, [px(k) - 0.22, -4.5]); addNode(gB, "q" + ks, [px(k) - 0.22, -4.5 + 7 / (k * k)]); addEdge(gB, "p" + ks, "q" + ks);
      if (k > 1.5) {
        addNode(gO, "p" + ks, [px(k) + 0.22, -4.5]); addNode(gO, "q" + ks, [px(k) + 0.22, -4.5 + 7 / (k * (k - 1))]); addEdge(gO, "p" + ks, "q" + ks);
      }
      addNode(gS, "s" + ks, [px(k), 3.0 + 1.3 * s]);
      addNode(gM, "m" + ks, [px(k), 3.0 + 1.3 * (2 - 1 / k)]);
      addNode(gL, "l" + ks, [px(k), -5.2], ks);
    }
    key = N;
  }
  float S = 0; repeat (N) { S = S + 1 / ((i + 1) * (i + 1)); }
  info = "**Метод оценки:** чтобы доказать ∑ₖ₌₁ⁿ 1/k² < 2, каждое слагаемое при k ≥ 2 заменяют бо́льшим, но уже «сворачивающимся»: 1/k² < 1/(k(k − 1)) = 1/(k − 1) − 1/k.\n\n"
    + "Складывая, получаем 1 + (1 − ½) + (½ − ⅓) + … + (1/(n − 1) − 1/n) = 2 − 1/n. Цепочка при n = " + format(N, 0) + ": **" + format(S, 4) + " < " + format(2 - 1 / N, 4) + " < 2**. Оценка достаточно точна: мажоранта отличается от слагаемого немного, а сумма мажорант — одно число, меньшее 2.";
}
]
