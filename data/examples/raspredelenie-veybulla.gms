[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Сверху — плотность f(t), снизу — интенсивность отказов h(t) = f(t)/(1 − F(t)); обе кривые
// обрезаны по верхнему краю панели. Обычная тонкая кривая — экспоненциальное распределение (k = 1)
// с тем же λ. Зелёная вертикаль — t = λ, оранжевая — медиана. ----
draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gEx"; graph = "gex"; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gLm"; graph = "glm"; edgeColor = #22c55e; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gMd"; graph = "gmd"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gCu"; graph = "gcu"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "t0"; pos = (px(0), -5.7); text = "0"; size = 0.9 }
draw Text { name = "t1"; pos = (px(1), -5.7); text = "1"; size = 0.9 }
draw Text { name = "t2"; pos = (px(2), -5.7); text = "2"; size = 0.9 }
draw Text { name = "t3"; pos = (px(3), -5.7); text = "3"; size = 0.9 }
draw Text { name = "t4"; pos = (px(4), -5.7); text = "4"; size = 0.9 }
draw Text { name = "t5"; pos = (px(5), -5.7); text = "5"; size = 0.9 }
draw Text { name = "t6"; pos = (px(6), -5.7); text = "6"; size = 0.9 }
draw Text { name = "pf"; pos = (-9.6, 5.6); text = "плотность f(t)"; size = 0.9; align = left }
draw Text { name = "ph"; pos = (-9.6, -0.9); text = "интенсивность отказов h(t)"; size = 0.9; align = left }
draw Text { name = "l1"; pos = (9.6, 5.6); text = "t = λ"; size = 0.9; align = right; color = #22c55e }
draw Text { name = "l2"; pos = (9.6, 4.9); text = "медиана"; size = 0.9; align = right; color = #f59e0b }
draw Text { name = "l3"; pos = (9.6, 4.2); text = "k = 1 (экспоненциальное)"; size = 0.9; align = right }

new UI { name = "sK"; type = slider; label = "k (форма)"; variable = kk; min = 0.5; max = 4; step = 0.1; default = 2 }
new UI { name = "sL"; type = slider; label = "λ (масштаб)"; variable = lm; min = 0.5; max = 3; step = 0.1; default = 1.5 }

// ---- Логика ----
float kk = 2; float lm = 1.5; float key = -1; string info = "";
Function px(u) { return -9.4 + 18.8 * u / 6; }
Function fw(t) { return kk / lm * pow(t / lm, kk - 1) * exp(-pow(t / lm, kk)); }
Function hw(t) { return kk / lm * pow(t / lm, kk - 1); }
Function fe(t) { return exp(-t / lm) / lm; }

Update {
  if (key != kk * 1000 + lm) {
    gg = newGraph(); gex = newGraph(); glm = newGraph(); gmd = newGraph(); gcu = newGraph();
    float fcap = 1.6 / lm; float hcap = 4.5 / lm;
    float sf = 4.4 / fcap; float sh = 3.6 / hcap;
    addNode(gg, "a1", [-9.4, 0.2]); addNode(gg, "a2", [9.4, 0.2]); addEdge(gg, "a1", "a2");
    addNode(gg, "b1", [-9.4, -5]); addNode(gg, "b2", [9.4, -5]); addEdge(gg, "b1", "b2");
    repeat (121) {
      float t = 0.02 + (6 - 0.02) * i / 120; string s = format(i, 0);
      addNode(gcu, "f" + s, [px(t), 0.2 + sf * min(fw(t), fcap)]);
      addNode(gcu, "h" + s, [px(t), -5 + sh * min(hw(t), hcap)]);
      addNode(gex, "f" + s, [px(t), 0.2 + sf * min(fe(t), fcap)]);
      addNode(gex, "h" + s, [px(t), -5 + sh * min(1 / lm, hcap)]);
      if (i > 0) {
        string q = format(i - 1, 0);
        addEdge(gcu, "f" + q, "f" + s); addEdge(gcu, "h" + q, "h" + s);
        addEdge(gex, "f" + q, "f" + s); addEdge(gex, "h" + q, "h" + s);
      }
    }
    float md = lm * pow(0.6931472, 1 / kk);
    addNode(glm, "a", [px(lm), -5]); addNode(glm, "b", [px(lm), 4.8]); addEdge(glm, "a", "b");
    addNode(gmd, "a", [px(md), -5]); addNode(gmd, "b", [px(md), 4.8]); addEdge(gmd, "a", "b");
    float g1 = gamma(1 + 1 / kk); float g2 = gamma(1 + 2 / kk);
    string hz = "возрастает со временем (износ)";
    if (kk < 0.995) { hz = "убывает со временем (ранние отказы)"; }
    if (abs(kk - 1) < 0.005) { hz = "постоянна — это экспоненциальное распределение"; }
    info = "**Распределение Вейбулла** с параметром формы k = " + format(kk, 1) + " и параметром масштаба λ = " + format(lm, 1) + ": f(t) = (k/λ)·(t/λ)ᵏ⁻¹·exp(−(t/λ)ᵏ) при t > 0, F(t) = 1 − exp(−(t/λ)ᵏ). При k = 1 получается экспоненциальное распределение.\n\n";
    info = info + "**Интенсивность отказов** h(t) = (k/λ)·(t/λ)ᵏ⁻¹ " + hz + ". Кривые обрезаны сверху; F(λ) = 1 − e⁻¹ ≈ 0.632 при любом k.\n\n";
    info = info + "**Моменты через гамма-функцию:** медиана λ·exp(ln(ln 2)/k) = " + format(md, 3) + ", E[T] = λ·Γ(1 + 1/k) = " + format(lm * g1, 3) + ", D[T] = λ²·(Γ(1 + 2/k) − Γ²(1 + 1/k)) = " + format(lm * lm * (g2 - g1 * g1), 3) + ". Изменение λ растягивает график, не меняя формы.";
    key = kk * 1000 + lm;
  }
}
]
