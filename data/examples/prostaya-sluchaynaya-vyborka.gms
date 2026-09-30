[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Слева — генеральная совокупность из N = 100 единиц; синие — попавшие в выборку.
// Справа — средние 30 разных выборок того же объёма вокруг среднего совокупности (оранжевая линия). ----
draw Graph { name = "gU"; graph = "gu"; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gSel"; graph = "gsel"; nodeColor = #3b82f6; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gM"; graph = "gm"; nodeColor = #3b82f6; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gCur"; graph = "gcur"; nodeColor = #f59e0b; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 7 }
draw Graph { name = "gMu"; graph = "gmu"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Text { name = "t1"; pos = (-4.7, 5.6); text = "генеральная совокупность"; size = 0.95 }
draw Text { name = "t2"; pos = (6.2, 5.6); text = "средние 30 выборок"; size = 0.95 }

new UI { name = "sN"; type = slider; label = "объём n"; variable = n; min = 2; max = 50; step = 1; default = 10 }
new UI { name = "sS"; type = slider; label = "выборка №"; variable = sd; min = 1; max = 30; step = 1; default = 1 }

float n = 10; float sd = 1; float key = -1; string info = "";
list perm = [0]; list means = [0];
float mu = 0; float cur = 0; float sdm = 0;

Function rnd(k) { float s = sin(k * 12.9898 + 78.233) * 43758.5453; return s - floor(s); }
Function val(j) { return 1 + 9 * rnd(j + 5000); }
Function cx(j) { return -9.3 + 1.15 * (j - 10 * floor(j / 10)); }
Function cy(j) { return 4.7 - 1.05 * floor(j / 10); }
// случайная выборка без возвращения: первые n элементов частичной перестановки
Function draw(s) {
  repeat (100) { perm[i] = i; }
  repeat (n) { float j = i + floor(rnd(s * 131 + i) * (100 - i)); float t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
}
Function smean(s) { draw(s); float sum = 0; repeat (n) { sum = sum + val(perm[i]); } return sum / n; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  if (key == -1) { repeat (99) { push(perm, 0); } repeat (29) { push(means, 0); } }
  if (key != n * 100 + sd) {
    gu = newGraph(); gsel = newGraph(); gm = newGraph(); gcur = newGraph(); gmu = newGraph();
    mu = 0; repeat (100) { mu = mu + val(i) / 100; addNode(gu, "u" + format(i, 0), [cx(i), cy(i)]); }
    repeat (30) { means[i] = smean(i + 1); }
    cur = smean(sd);
    repeat (n) { addNode(gsel, "s" + format(i, 0), [cx(perm[i]), cy(perm[i])]); }
    // средние: x — значение (масштаб 1.6 на единицу), y — номер выборки
    float m2 = 0; repeat (30) { m2 = m2 + means[i] / 30; }
    sdm = 0; repeat (30) { sdm = sdm + (means[i] - m2) * (means[i] - m2) / 30; } sdm = sqrt(sdm);
    repeat (30) {
      float px = 6.2 + (means[i] - mu) * 1.1; float py = 4.6 - 0.31 * i;
      if (i + 1 == sd) { addNode(gcur, "m" + format(i, 0), [px, py]); }
      if (i + 1 != sd) { addNode(gm, "m" + format(i, 0), [px, py]); }
    }
    addNode(gmu, "b1", [6.2, -4.8]); addNode(gmu, "b2", [6.2, 5.0]); addEdge(gmu, "b1", "b2");
    key = n * 100 + sd;
  }
  info = "**Простая случайная выборка:** из N = 100 единиц отбираются n = " + format(n, 0) + ", причём любой набор из n единиц равновозможен. Поэтому каждая единица входит в выборку с вероятностью n/N = **" + format(n / 100, 2) + "**.\n\n";
  info = info + "Среднее совокупности μ = **" + num(mu, 2) + "**, среднее выборки №" + format(sd, 0) + " x̄ = **" + num(cur, 2) + "**. Среднее сдвигается от выборки к выборке случайно, но без систематического отклонения: центр значений x̄ на 30 выборках около μ, разброс " + num(sdm, 2) + " уменьшается с ростом n.";
}
]
