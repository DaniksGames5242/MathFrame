[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float n = 360; string st = "a"; float s = 0; float key = -1; string canon = ""; string info = "";
new UI { type = slider; label = "n"; variable = n; min = 2; max = 500; step = 1; default = 360 }
new UI { type = select; label = "как делить"; variable = st; options = ("a", "b", "c"); labels = ("на наименьший простой", "на наибольший делитель", "пополам (ближе к √)"); default = "a" }
draw Graph { name = "gE"; graph = "g3"; edgeColor = #3b82f6; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "g1"; nodeColor = #3b82f6; nodeRadius = 19; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gP"; graph = "g2"; nodeColor = #22c55e; nodeRadius = 19; interactive = false; showWeights = false; layer = 10 }
Function md(x, y) { return x - y * floor(x / y); }
Function spf(m) { float d = 2; repeat (25) { if (d * d <= m && md(m, d) != 0) { d = d + 1; } } if (d * d > m) { return m; } return d; }
Function pick(m, st) {
  float p = spf(m);
  if (st == 0) { return p; }
  if (st == 1) { return m / p; }
  float d = p; float e = 2;
  repeat (23) { if (e * e <= m) { if (md(m, e) == 0) { d = e; } } e = e + 1; }
  return d;
}
Function sup(e) { if (e == 1) { return ""; } if (e == 2) { return "²"; } if (e == 3) { return "³"; } if (e == 4) { return "⁴"; } if (e == 5) { return "⁵"; } if (e == 6) { return "⁶"; } if (e == 7) { return "⁷"; } if (e == 8) { return "⁸"; } return "⁹"; }
Update {
  n = round(n);
  s = 0; if (st == "b") { s = 1; } if (st == "c") { s = 2; }
  if (key != n * 10 + s) {
    g1 = newGraph(); g2 = newGraph(); g3 = newGraph();
    list val = [0]; list lev = [0]; list par = [0];
    push(val, n); push(lev, 0); push(par, 0);
    float cnt = 1; float j = 1;
    repeat (16) {
      if (j <= cnt) {
        float m = val[j];
        if (spf(m) < m) { float d = pick(m, s); push(val, d); push(lev, lev[j] + 1); push(par, j); push(val, m / d); push(lev, lev[j] + 1); push(par, j); cnt = cnt + 2; }
        j = j + 1;
      }
    }
    list X = [0]; list Y = [0];
    repeat (cnt) {
      float u = i + 1; float w = 0; float rk = 0;
      repeat (cnt) { if (lev[i + 1] == lev[u]) { w = w + 1; if (i + 1 < u) { rk = rk + 1; } } }
      push(X, (rk - (w - 1) / 2) * 2.2); push(Y, 4.2 - 1.15 * lev[u]);
    }
    repeat (cnt) {
      float u2 = i + 1;
      string k2 = "n" + format(u2, 0);
      if (spf(val[u2]) == val[u2]) { addNode(g2, k2, [X[u2], Y[u2]], format(val[u2], 0)); } else { addNode(g1, k2, [X[u2], Y[u2]], format(val[u2], 0)); }
      if (par[u2] > 0) { addNode(g3, k2, [X[u2], Y[u2]]); addNode(g3, "n" + format(par[u2], 0), [X[par[u2]], Y[par[u2]]]); addEdge(g3, "n" + format(par[u2], 0), k2); }
    }
    key = n * 10 + s;
  }
  float m2 = n; float dd = 2; canon = "";
  repeat (25) {
    if (dd * dd <= m2) {
      if (md(m2, dd) == 0) { float e = 0; repeat (9) { if (md(m2, dd) == 0) { m2 = m2 / dd; e = e + 1; } } if (canon != "") { canon = canon + " · "; } canon = canon + format(dd, 0) + sup(e); }
      dd = dd + 1;
    }
  }
  if (m2 > 1) { if (canon != "") { canon = canon + " · "; } canon = canon + format(m2, 0); }
  info = "**Основная теорема арифметики:** всякое натуральное n > 1 раскладывается в произведение простых, и разложение единственно с точностью до порядка множителей.\n\nn = " + format(n, 0) + " — синие числа делятся на два множителя, зелёные — простые (листья дерева). Как бы ни делить, набор листьев один и тот же: n = **" + canon + "**.";
  if (spf(n) == n) { info = info + "\n\nn простое — оно само является своим разложением."; }
}
]
