[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Столбики — P(X = k) = C(K, k)·C(N − K, n − k)/C(N, n), k = 0…n. Оранжевые точки — биномиальное
// распределение B(n, K/N) (выбор с возвращением): чем больше N при той же доле K/N, тем ближе. ----
draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gB"; graph = "gb"; edgeWidth = 12; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gN"; graph = "gn"; nodeColor = #f59e0b; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "t0"; pos = (px(0), -5.7); text = "0"; size = 0.9 }
draw Text { name = "tm"; pos = (px(floor(nn / 2)), -5.7); text = format(floor(nn / 2), 0); size = 0.9; active = nn > 3 }
draw Text { name = "tn"; pos = (px(nn), -5.7); text = format(nn, 0); size = 0.9 }
draw Text { name = "tk"; pos = (9.6, -5.7); text = "k"; size = 0.9 }
draw Text { name = "ty"; pos = (-9.6, 5.5); text = "линии сетки — через " + format(gstep, 2); size = 0.9; align = left }

new UI { name = "sN"; type = slider; label = "N"; variable = Nt; min = 5; max = 40; step = 1; default = 20 }
new UI { name = "sK"; type = slider; label = "K"; variable = Kt; min = 0; max = Nt; step = 1; default = 8 }
new UI { name = "sn"; type = slider; label = "n"; variable = nn; min = 1; max = Nt; step = 1; default = 6 }

// ---- Логика ----
float Nt = 20; float Kt = 8; float nn = 6; float key = -1; float gstep = 0.1;
string info = "";
Function px(u) { return -9.4 + 18.8 * (u + 0.5) / (nn + 1); }
// ln C(m, r), для допустимых 0 ≤ r ≤ m
Function lc(m, r) { float s = 0; repeat (r) { s = s + log((m - r + i + 1) / (i + 1)); } return s; }
Function hyp(k) {
  if (k < 0 || k > Kt || nn - k < 0 || nn - k > Nt - Kt) { return 0; }
  return exp(lc(Kt, k) + lc(Nt - Kt, nn - k) - lc(Nt, nn));
}
Function bin(k) {
  float pr = Kt / Nt;
  if (pr == 0) { if (k == 0) { return 1; } return 0; }
  if (pr == 1) { if (k == nn) { return 1; } return 0; }
  return exp(lc(nn, k) + k * log(pr) + (nn - k) * log(1 - pr));
}

Update {
  if (key != Nt * 10000 + Kt * 100 + nn) {
    gg = newGraph(); gb = newGraph(); gn = newGraph();
    float pmax = 0;
    repeat (nn + 1) { pmax = max(pmax, max(hyp(i), bin(i))); }
    gstep = 0.05; if (pmax > 0.25) { gstep = 0.1; } if (pmax > 0.6) { gstep = 0.2; }
    float tp = gstep * ceil(pmax / gstep - 0.0001);
    float sy = 10 / tp;
    addNode(gg, "x1", [-9.6, -5]); addNode(gg, "x2", [9.6, -5]); addEdge(gg, "x1", "x2");
    repeat (round(tp / gstep)) {
      string s = format(i + 1, 0);
      addNode(gg, "l" + s, [-9.6, -5 + gstep * sy * (i + 1)]); addNode(gg, "r" + s, [9.6, -5 + gstep * sy * (i + 1)]); addEdge(gg, "l" + s, "r" + s);
    }
    repeat (nn + 1) {
      string s = format(i, 0);
      addNode(gb, "a" + s, [px(i), -5]); addNode(gb, "b" + s, [px(i), -5 + sy * hyp(i)]); addEdge(gb, "a" + s, "b" + s, 1, "#3b82f6");
      addNode(gn, "n" + s, [px(i), -5 + sy * bin(i)]);
    }
    float kmin = max(0, nn - (Nt - Kt)); float kmax = min(nn, Kt);
    float fr = Kt / Nt;
    info = "**Гипергеометрическое распределение:** в совокупности из N = " + format(Nt, 0) + " объектов K = " + format(Kt, 0) + " нужного вида; выбираем n = " + format(nn, 0) + " без возвращения, X — число объектов нужного вида в выборке. P(X = k) = C(K, k)·C(N − K, n − k)/C(N, n).\n\n**Носитель:** max(0, n − (N − K)) ≤ k ≤ min(n, K), то есть k от " + format(kmin, 0) + " до " + format(kmax, 0) + "; вне него столбиков нет. E[X] = nK/N = " + format(nn * fr, 3) + ", D[X] = n·(K/N)(1 − K/N)·(N − n)/(N − 1) = " + format(nn * fr * (1 - fr) * (Nt - nn) / (Nt - 1), 3) + ".\n\n**Связь с биномиальным.** Оранжевые точки — B(n, K/N) при доле K/N = " + format(fr, 3) + ": E тот же, а D = n·(K/N)(1 − K/N) = " + format(nn * fr * (1 - fr), 3) + " больше на множитель (N − n)/(N − 1). При N → ∞ и постоянной доле множитель стремится к 1 и распределения совпадают.";
    key = Nt * 10000 + Kt * 100 + nn;
  }
}
]
