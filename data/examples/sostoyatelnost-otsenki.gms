[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;

// ---- 30 независимых серий наблюдений из N(θ; 1), θ = 0. По каждой серии строится траектория
// оценки θ̂ₙ при n = 1 … N. Зелёная линия — θ, жёлтые — границы θ ± ε.
// Конечные точки: зелёные — попали в полосу, жёлтые — нет. ----
draw Graph { name = "gP"; graph = "gp"; edgeColor = #3b82f688; edgeWidth = 1.2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gIn"; graph = "gin"; nodeColor = #22c55e; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gOut"; graph = "gout"; nodeColor = #f59e0b; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gTh"; graph = "gth"; edgeColor = #22c55e; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gEp"; graph = "gep"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Text { name = "lTh"; pos = (-7.6, 0.35); text = "θ"; size = 1; align = left; color = #22c55e }
draw Text { name = "lEp"; pos = (7.6, 1.5 * eps + 0.35); text = "θ + ε"; size = 0.9; align = right; color = #f59e0b }
draw Text { name = "lEm"; pos = (7.6, -1.5 * eps - 0.35); text = "θ − ε"; size = 0.9; align = right; color = #f59e0b }
draw Text { name = "l1"; pos = (-7.6, -4.7); text = "n = 1"; size = 0.9; align = left }
draw Text { name = "l2"; pos = (7.6, -4.7); text = "n = " + format(N, 0); size = 0.9; align = right }

new UI { name = "sE"; type = select; label = "оценка θ̂ₙ"; variable = est; options = ("mean", "first", "ends"); labels = ("X̄ₙ — среднее", "X₁ — первое наблюдение", "(X₁ + Xₙ)/2"); default = "mean" }
new UI { name = "sN"; type = slider; label = "n до"; variable = N; min = 5; max = 200; step = 1; default = 60 }
new UI { name = "sP"; type = slider; label = "ε"; variable = eps; min = 0.1; max = 1.5; step = 0.05; default = 0.3 }
new UI { name = "sS"; type = slider; label = "серия"; variable = seed; min = 1; max = 30; step = 1; default = 1 }

string est = "mean"; float N = 60; float eps = 0.3; float seed = 1; float key = -1; float hit = 0;
string info = "";

Function rnd(k) { float v = sin(k * 12.9898 + 4.1) * 43758.5453; return v - floor(v); }
Function nrm(k) { return sqrt(-2 * log(rnd(2 * k) + 0.000001)) * cos(2 * pi * rnd(2 * k + 1)); }
Function px(j) { return -7.5 + 15 * j / (N - 1); }
Function py(v) { return max(-4.5, min(4.5, 1.5 * v)); }
Function sdv() { if (est == "mean") { return 1 / sqrt(N); } if (est == "first") { return 1; } return sqrt(0.5); }

Update {
  float ke = 0; if (est == "first") { ke = 1; } if (est == "ends") { ke = 2; }
  if (key != ((seed * 1000 + N) * 4 + ke) * 100 + eps * 20) {
    key = ((seed * 1000 + N) * 4 + ke) * 100 + eps * 20;
    gp = newGraph(); gin = newGraph(); gout = newGraph(); gth = newGraph(); gep = newGraph();
    hit = 0;
    repeat (30) {
      float r = i; float cum = 0; float x1 = nrm(seed * 100000 + r * 1000); float vl = 0; string pn = "";
      repeat (N) {
        float j = i; float xj = nrm(seed * 100000 + r * 1000 + j);
        cum = cum + xj;
        float v = cum / (j + 1);
        if (est == "first") { v = x1; }
        if (est == "ends") { v = (x1 + xj) / 2; }
        string nm = "n" + format(r, 0) + "_" + format(j, 0);
        addNode(gp, nm, [px(j), py(v)]);
        if (j > 0) { addEdge(gp, pn, nm); }
        pn = nm; vl = v;
      }
      if (abs(vl) < eps) { hit = hit + 1; addNode(gin, "e" + format(r, 0), [7.5, py(vl)]); } else { addNode(gout, "e" + format(r, 0), [7.5, py(vl)]); }
    }
    addNode(gth, "p", [-7.5, 0]); addNode(gth, "q", [7.5, 0]); addEdge(gth, "p", "q");
    addNode(gep, "p", [-7.5, 1.5 * eps]); addNode(gep, "q", [7.5, 1.5 * eps]); addEdge(gep, "p", "q");
    addNode(gep, "r", [-7.5, -1.5 * eps]); addNode(gep, "s", [7.5, -1.5 * eps]); addEdge(gep, "r", "s");
  }
  info = "**Состоятельность:** оценка θ̂ₙ состоятельна, если для любого ε > 0 вероятность P(|θ̂ₙ − θ| < ε) → 1 при n → ∞. Здесь θ = 0 — математическое ожидание N(θ; 1), ε = **" + format(eps, 2) + "**.\n\n";
  info = info + "При n = **" + format(N, 0) + "** в полосу |θ̂ₙ − θ| < ε попали **" + format(hit, 0) + "** из 30 траекторий; теоретически P = **" + format(2 * normalCdf(eps / sdv()) - 1, 3) + "**.\n\n";
  if (est == "mean") { info = info + "**θ̂ₙ = X̄ₙ:** дисперсия 1/n → 0, траектории стягиваются к θ — оценка состоятельна (закон больших чисел)."; }
  if (est == "first") { info = info + "**θ̂ₙ = X₁:** оценка несмещённая, но от n не зависит: её распределение при росте выборки не сужается, вероятность попасть в полосу остаётся той же — оценка **несостоятельна**."; }
  if (est == "ends") { info = info + "**θ̂ₙ = (X₁ + Xₙ)/2:** оценка несмещённая, но её дисперсия равна ½ при любом n — вероятность попадания в полосу не растёт, оценка **несостоятельна**. Несмещённость не влечёт состоятельности."; }
}
]
