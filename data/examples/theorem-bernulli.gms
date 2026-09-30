[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- 16 независимых серий испытаний: ломаные — относительная частота ν = m/n успеха после n испытаний.
// Горизонтальные линии — вероятность p и полоса p ± ε (оранжевая); вертикальная линия — выбранное n, кружки на ней —
// частоты серий (оранжевые — вышли за полосу). ----
draw Graph { name = "gG"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gP"; graph = "gp"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gL"; graph = "gl"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gI"; graph = "gi"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gO"; graph = "go"; nodeColor = #f59e0b; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Text { name = "t0"; pos = (-9.6, -5.5); text = "0"; size = 0.85 }
draw Text { name = "t1"; pos = (-9.6, 5.5); text = "1"; size = 0.85 }
draw Text { name = "tn"; pos = (9.5, -5.75); text = "n"; size = 0.85 }

new UI { name = "sP"; type = slider; label = "p"; variable = p; min = 0.05; max = 0.95; step = 0.01; default = 0.4 }
new UI { name = "sE"; type = slider; label = "ε"; variable = eps; min = 0.02; max = 0.3; step = 0.01; default = 0.1 }
new UI { name = "sN"; type = slider; label = "n"; variable = N; min = 5; max = 200; step = 1; default = 60 }
new UI { name = "bR"; type = button; label = "Новые серии"; action = "seed = seed + 1" }

// ---- Логика ----
float p = 0.4; float eps = 0.1; float N = 60; float seed = 1; float sd = 0; float init = 0; float pk = -1; float key = -1;
list u = [0]; list fr = [0]; list lfl = [0]; string info = "";
Function px(n) { return -9.4 + 18.8 * (n - 1) / 199; }
Function py(f) { return -5.5 + 11 * f; }

Update {
  if (init == 0) { repeat (3199) { push(u, 0); push(fr, 0); } repeat (200) { push(lfl, lfl[i] + log(i + 1)); } init = 1; }
  if (sd != seed) { sd = seed; repeat (3200) { u[i] = random(0, 1); } pk = -1; }
  if (pk != p) {
    pk = p; gp = newGraph();
    repeat (16) {
      float r = i; float m = 0;
      repeat (200) {
        if (u[r * 200 + i] < p) { m = m + 1; }
        fr[r * 200 + i] = m / (i + 1);
        addNode(gp, "p" + format(r, 0) + "_" + format(i, 0), [px(i + 1), py(m / (i + 1))]);
        if (i > 0) { addEdge(gp, "p" + format(r, 0) + "_" + format(i - 1, 0), "p" + format(r, 0) + "_" + format(i, 0)); }
      }
    }
    key = -1;
  }
  if (key != N * 100000 + eps * 1000 + p) {
    key = N * 100000 + eps * 1000 + p;
    gg = newGraph(); gl = newGraph(); gi = newGraph(); go = newGraph();
    repeat (5) { string s = format(i, 0); addNode(gg, "l" + s, [-9.4, py(i / 4)]); addNode(gg, "r" + s, [9.4, py(i / 4)]); addEdge(gg, "l" + s, "r" + s); }
    repeat (4) { string s = format(i, 0); addNode(gg, "u" + s, [px(50 * (i + 1)), -5.5]); addNode(gg, "v" + s, [px(50 * (i + 1)), 5.5]); addEdge(gg, "u" + s, "v" + s); }
    addNode(gl, "p1", [-9.4, py(p)]); addNode(gl, "p2", [9.4, py(p)]); addEdge(gl, "p1", "p2", 1, "#3b82f6");
    if (p - eps > 0) { addNode(gl, "a1", [-9.4, py(p - eps)]); addNode(gl, "a2", [9.4, py(p - eps)]); addEdge(gl, "a1", "a2"); }
    if (p + eps < 1) { addNode(gl, "b1", [-9.4, py(p + eps)]); addNode(gl, "b2", [9.4, py(p + eps)]); addEdge(gl, "b1", "b2"); }
    addNode(gl, "n1", [px(N), -5.5]); addNode(gl, "n2", [px(N), 5.5]); addEdge(gl, "n1", "n2", 1, "#3b82f688");
    float out = 0;
    repeat (16) {
      float f = fr[i * 200 + N - 1];
      if (abs(f - p) > eps + 0.000001) { out = out + 1; addNode(go, "o" + format(i, 0), [px(N), py(f)]); } else { addNode(gi, "i" + format(i, 0), [px(N), py(f)]); }
    }
    float ex = 0;
    repeat (N + 1) { float m = i; if (abs(m / N - p) > eps + 0.000001) { ex = ex + exp(lfl[N] - lfl[m] - lfl[N - m] + m * log(p) + (N - m) * log(1 - p)); } }
    float bd = p * (1 - p) / (N * eps * eps);
    info = "**Теорема Бернулли:** пусть в каждом из n независимых испытаний событие наступает с вероятностью p = " + format(p, 2) + ", а m — число наступлений. Тогда для любого ε > 0 вероятность P(|m/n − p| > ε) → 0 при n → ∞: относительная частота сходится по вероятности к p.\n\n";
    info = info + "**При n = " + format(N, 0) + ", ε = " + format(eps, 2) + ":** точная вероятность P(|m/n − p| > ε) = " + format(ex, 4) + " (биномиальное распределение); оценка через неравенство Чебышёва p(1 − p)/(nε²) = " + format(bd, 4) + "; из 16 серий за полосу вышли " + format(out, 0) + ". С ростом n все три числа убывают к нулю, но остаются положительными при любом конечном n.";
  }
}
]
