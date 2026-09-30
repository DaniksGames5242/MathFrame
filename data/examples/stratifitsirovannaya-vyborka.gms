[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Сверху — совокупность из N = 90 единиц в трёх стратах; синие — попавшие в выборку (в каждой страте своя подвыборка).
// Внизу — оценки среднего на 30 выборках: простой случайной (сверху) и стратифицированной (снизу). ----
draw Graph { name = "gU"; graph = "gu"; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gSel"; graph = "gsel"; nodeColor = #3b82f6; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gA"; graph = "ga"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #22c55e; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gMu"; graph = "gmu"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gDv"; graph = "gdv"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "t1"; pos = (-9.5, 5.5); text = "страта 1"; size = 0.85; align = left }
draw Text { name = "t2"; pos = (-9.5, 3.0); text = "страта 2"; size = 0.85; align = left }
draw Text { name = "t3"; pos = (-9.5, 0.85); text = "страта 3"; size = 0.85; align = left }
draw Text { name = "t4"; pos = (-9.5, -0.5); text = "простая случайная выборка"; size = 0.85; align = left }
draw Text { name = "t5"; pos = (-9.5, -2.9); text = "стратифицированная выборка"; size = 0.85; align = left }

new UI { name = "sN"; type = slider; label = "объём n"; variable = n; min = 6; max = 45; step = 1; default = 18 }
new UI { name = "sD"; type = slider; label = "различие страт"; variable = dl; min = 0; max = 3; step = 0.1; default = 2 }
new UI { name = "sS"; type = slider; label = "выборка №"; variable = sd; min = 1; max = 30; step = 1; default = 1 }

float n = 18; float dl = 2; float sd = 1; float key = -1; string info = "";
list perm = [0];
float mu = 0; float xs = 0; float xr = 0; float vs = 0; float vr = 0; float n2 = 0;

Function rnd(k) { float s = sin(k * 12.9898 + 78.233) * 43758.5453; return s - floor(s); }
Function Nh(h) { if (h == 0) { return 40; } if (h == 1) { return 30; } return 20; }
Function st(h) { if (h == 0) { return 0; } if (h == 1) { return 40; } return 70; }
Function sh(j) { if (j < 40) { return 0; } if (j < 70) { return 1; } return 2; }
Function nh(h) { return max(1, round(n * Nh(h) / 90)); }
Function val(j) { return 5 + dl * (sh(j) - 1) + 3 * (rnd(j + 7000) - 0.5); }
Function cx(j) { float l = j - st(sh(j)); return -8.55 + 0.9 * (l - 20 * floor(l / 20)); }
Function cy(j) {
  float l = j - st(sh(j)); float r = floor(l / 20); float h = sh(j);
  if (h == 0) { return 4.6 - 0.9 * r; } if (h == 1) { return 2.3 - 0.9 * r; } return 0.2;
}
// частичная перестановка size единиц с номера start: первые k — выбранные
Function shuf(s, size, start, k) {
  repeat (size) { perm[i] = start + i; }
  repeat (k) { float j = i + floor(rnd(s * 131 + i) * (size - i)); float t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
}
Function mean(s, size, start, k) { shuf(s, size, start, k); float sum = 0; repeat (k) { sum = sum + val(perm[i]); } return sum / k; }
Function estSt(s) {
  float sum = 0;
  repeat (3) { sum = sum + Nh(i) / 90 * mean(s * 3 + i, Nh(i), st(i), nh(i)); }
  return sum;
}
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function ex(v) { return max(-9.3, min(9.3, (v - mu) * 4)); }

Update {
  if (key == -1) { repeat (89) { push(perm, 0); } }
  if (key != (n * 100 + dl * 10) * 100 + sd) {
    gu = newGraph(); gsel = newGraph(); ga = newGraph(); gb = newGraph(); gmu = newGraph(); gdv = newGraph();
    mu = 0; repeat (90) { mu = mu + val(i) / 90; addNode(gu, "u" + format(i, 0), [cx(i), cy(i)]); }
    n2 = nh(0) + nh(1) + nh(2);
    // выбранные единицы текущей выборки
    repeat (3) {
      float h = i; shuf(sd * 3 + h, Nh(h), st(h), nh(h));
      repeat (nh(h)) { addNode(gsel, "s" + format(h * 100 + i, 0), [cx(perm[i]), cy(perm[i])]); }
    }
    xs = estSt(sd); xr = mean(sd + 500, 90, 0, n2);
    // дисперсии оценок: по данным совокупности
    float s2 = 0; repeat (90) { s2 = s2 + (val(i) - mu) * (val(i) - mu) / 89; }
    vr = (1 - n2 / 90) * s2 / n2;
    vs = 0;
    repeat (3) {
      float h = i; float m = 0; repeat (Nh(h)) { m = m + val(st(h) + i) / Nh(h); }
      float q = 0; repeat (Nh(h)) { q = q + (val(st(h) + i) - m) * (val(st(h) + i) - m) / (Nh(h) - 1); }
      vs = vs + (Nh(h) / 90) * (Nh(h) / 90) * (1 - nh(h) / Nh(h)) * q / nh(h);
    }
    repeat (30) {
      float ya = -1.5 - 0.3 * (i - 3 * floor(i / 3)); float yb = -3.9 - 0.3 * (i - 3 * floor(i / 3));
      float ea = ex(mean(i + 501, 90, 0, n2)); float eb = ex(estSt(i + 1));
      addNode(ga, "a" + format(i, 0), [ea, ya]); addNode(gb, "b" + format(i, 0), [eb, yb]);
    }
    addNode(gmu, "m1", [0, -0.9]); addNode(gmu, "m2", [0, -4.9]); addEdge(gmu, "m1", "m2");
    addNode(gdv, "d1", [-9.5, 3.4]); addNode(gdv, "d2", [9.5, 3.4]); addEdge(gdv, "d1", "d2");
    addNode(gdv, "e1", [-9.5, 1.2]); addNode(gdv, "e2", [9.5, 1.2]); addEdge(gdv, "e1", "e2");
    addNode(gdv, "f1", [-9.5, -0.2]); addNode(gdv, "f2", [9.5, -0.2]); addEdge(gdv, "f1", "f2");
    key = (n * 100 + dl * 10) * 100 + sd;
  }
  info = "**Стратифицированная выборка:** совокупность разбита на страты (N₁ = 40, N₂ = 30, N₃ = 20), и из каждой страты случайно отбирается своя подвыборка: n₁ = " + format(nh(0), 0) + ", n₂ = " + format(nh(1), 0) + ", n₃ = " + format(nh(2), 0) + " (всего " + format(n2, 0) + ", пропорционально размеру).\n\n";
  info = info + "Оценка среднего — взвешенное среднее по стратам x̄ = Σ (Nₕ/N)·x̄ₕ: на выборке №" + format(sd, 0) + " она равна **" + num(xs, 2) + "** при среднем совокупности μ = " + num(mu, 2) + " (оранжевая линия), а простая случайная выборка того же объёма даёт " + num(xr, 2) + ".\n\n";
  info = info + "Стандартная ошибка стратифицированной оценки **" + num(sqrt(vs), 2) + "**, простой случайной — " + num(sqrt(vr), 2) + ": чем сильнее страты различаются между собой, тем выше выигрыш.";
}
]
