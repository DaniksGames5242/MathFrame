[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Независимые величины Xᵢ = aᵢ + sᵢ·zᵢ: у каждой своё математическое ожидание aᵢ и своя дисперсия Dᵢ = sᵢ² ≤ σ²
// (zᵢ — равномерная с нулевым средним и единичной дисперсией). Ломаные — средние арифметические Sₙ/n в 12 реализациях,
// толстая линия — среднее арифметическое ожиданий (a₁ + … + aₙ)/n, оранжевая полоса — эта линия ± ε. ----
draw Graph { name = "gG"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gP"; graph = "gp"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gL"; graph = "gl"; edgeColor = #f59e0b; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gI"; graph = "gi"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gO"; graph = "go"; nodeColor = #f59e0b; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Text { name = "t0"; pos = (-9.6, -5.5); text = "0"; size = 0.85 }
draw Text { name = "t1"; pos = (-9.6, 5.5); text = "8"; size = 0.85 }
draw Text { name = "tn"; pos = (9.5, -5.75); text = "n"; size = 0.85 }

new UI { name = "sS"; type = slider; label = "σ (Dᵢ ≤ σ²)"; variable = sg; min = 0.25; max = 3; step = 0.25; default = 1.5 }
new UI { name = "sE"; type = slider; label = "ε"; variable = eps; min = 0.1; max = 1.5; step = 0.1; default = 0.5 }
new UI { name = "sN"; type = slider; label = "n"; variable = N; min = 5; max = 200; step = 1; default = 60 }
new UI { name = "bR"; type = button; label = "Новые реализации"; action = "seed = seed + 1" }

// ---- Логика ----
float sg = 1.5; float eps = 0.5; float N = 60; float seed = 1; float sd = 0; float init = 0; float pk = -1; float ek = -1; float key = -1;
list z = [0]; list w = [0]; list am = [0]; list c0 = [0]; list sw = [0]; string info = "";
Function px(n) { return -9.4 + 18.8 * (n - 1) / 199; }
Function py(v) { return max(-5.6, min(5.6, -5.5 + 11 * v / 8)); }
Function ai(n) { return 4 + 3 * sin(n / 9); }

Update {
  if (init == 0) {
    repeat (2399) { push(z, 0); push(c0, 0); }
    repeat (199) { push(w, 0); push(am, 0); push(sw, 0); }
    float s = 0; float v = 0;
    repeat (200) { w[i] = 0.5 + 0.5 * abs(sin(1.3 * (i + 1))); s = s + ai(i + 1); am[i] = s / (i + 1); v = v + w[i] * w[i]; sw[i] = v; }
    gg = newGraph();
    repeat (5) { string t = format(i, 0); addNode(gg, "l" + t, [-9.4, py(2 * i)]); addNode(gg, "r" + t, [9.4, py(2 * i)]); addEdge(gg, "l" + t, "r" + t); }
    repeat (4) { string t = format(i, 0); addNode(gg, "u" + t, [px(50 * (i + 1)), -5.5]); addNode(gg, "v" + t, [px(50 * (i + 1)), 5.5]); addEdge(gg, "u" + t, "v" + t); }
    ga = newGraph(); string pv = "";
    repeat (200) { string cur = "a" + format(i, 0); addNode(ga, cur, [px(i + 1), py(am[i])]); if (i > 0) { addEdge(ga, pv, cur); } pv = cur; }
    init = 1;
  }
  if (sd != seed) {
    sd = seed; pk = -1;
    repeat (2400) { z[i] = random(-1.7320508, 1.7320508); }
    repeat (12) { float r = i; float cs = 0; repeat (200) { cs = cs + w[i] * z[r * 200 + i]; c0[r * 200 + i] = cs / (i + 1); } }
  }
  if (pk != sg) {
    pk = sg; gp = newGraph();
    repeat (12) {
      float r = i; string pv = "";
      repeat (200) { string cur = "p" + format(r * 200 + i, 0); addNode(gp, cur, [px(i + 1), py(am[i] + sg * c0[r * 200 + i])]); if (i > 0) { addEdge(gp, pv, cur); } pv = cur; }
    }
    key = -1;
  }
  if (ek != eps) {
    ek = eps; gl = newGraph(); string pa = ""; string pb = "";
    repeat (200) {
      string ca = "a" + format(i, 0); string cb = "b" + format(i, 0);
      addNode(gl, ca, [px(i + 1), py(am[i] - eps)]); addNode(gl, cb, [px(i + 1), py(am[i] + eps)]);
      if (i > 0) { addEdge(gl, pa, ca); addEdge(gl, pb, cb); } pa = ca; pb = cb;
    }
    key = -1;
  }
  if (key != N * 1000000 + eps * 1000 + sg * 10 + sd) {
    key = N * 1000000 + eps * 1000 + sg * 10 + sd;
    gi = newGraph(); go = newGraph();
    float out = 0;
    repeat (12) {
      float d = sg * c0[i * 200 + N - 1];
      if (abs(d) > eps) { out = out + 1; addNode(go, "o" + format(i, 0), [px(N), py(am[N - 1] + d)]); } else { addNode(gi, "i" + format(i, 0), [px(N), py(am[N - 1] + d)]); }
    }
    float bd = sg * sg * sw[N - 1] / (N * N * eps * eps);
    info = "**Теорема Чебышёва:** если X₁, X₂, … — попарно независимые величины с математическими ожиданиями aᵢ и дисперсиями Dᵢ ≤ C, то для любого ε > 0 вероятность P(|Sₙ/n − (a₁ + … + aₙ)/n| > ε) → 0 при n → ∞. Здесь aᵢ различны (серая линия не постоянна), а Dᵢ = sᵢ² не совпадают и ограничены C = σ² = " + format(sg * sg, 2) + ".\n\n";
    info = info + "**При n = " + format(N, 0) + ", ε = " + format(eps, 2) + ":** среднее ожиданий равно " + format(am[N - 1], 2) + ", оценка через неравенство Чебышёва (D₁ + … + Dₙ)/(n²ε²) = " + format(bd, 3) + "; из 12 реализаций за полосу вышли " + format(out, 0) + ". Оценка ≤ C/(nε²) = " + format(sg * sg / (N * eps * eps), 3) + " стремится к нулю при росте n — средние арифметические «прижимаются» к средним ожиданий, хотя сами ожидания не сходятся ни к какому пределу.";
  }
}
]
