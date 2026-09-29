[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Схема Бернулли: n независимых испытаний, успех с вероятностью p. Столбики — Pₙ(k) = C(n, k) pᵏ qⁿ⁻ᵏ,
// зелёный — выбранное k. Оранжевая ломаная — предельное приближение при большом n (Пуассона или Муавра — Лапласа). ----
float n = 20; float p = 0.3; float k = 6; string ap = "none";
float top = 0.2; float st = 0.05; float kx = 2; float mo = 0;
string key = ""; string info = "";

draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gB0"; graph = "gb"; edgeCap = butt; edgeWidth = 70; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5; active = n + 1 > 0 && n + 1 <= 7 }
draw Graph { name = "gB1"; graph = "gb"; edgeCap = butt; edgeWidth = 55; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5; active = n + 1 > 7 && n + 1 <= 12 }
draw Graph { name = "gB2"; graph = "gb"; edgeCap = butt; edgeWidth = 36; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5; active = n + 1 > 12 && n + 1 <= 20 }
draw Graph { name = "gB3"; graph = "gb"; edgeCap = butt; edgeWidth = 22; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5; active = n + 1 > 20 && n + 1 <= 32 }
draw Graph { name = "gB4"; graph = "gb"; edgeCap = butt; edgeWidth = 14; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5; active = n + 1 > 32 && n + 1 <= 48 }
draw Graph { name = "gB5"; graph = "gb"; edgeCap = butt; edgeWidth = 10; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5; active = n + 1 > 48 && n + 1 <= 61 }
draw Graph { name = "gApp"; graph = "ga"; nodeColor = #f59e0b; edgeColor = #f59e0b; nodeRadius = 4; edgeWidth = 2; labels = false; interactive = false; showWeights = false; layer = 8; active = ap != "none" }
draw Text { name = "ty1"; pos = (-6.8, py(1 * st)); text = tl(1 * st); size = 0.75; align = right; active = 1 * st <= top }
draw Text { name = "ty2"; pos = (-6.8, py(2 * st)); text = tl(2 * st); size = 0.75; align = right; active = 2 * st <= top }
draw Text { name = "ty3"; pos = (-6.8, py(3 * st)); text = tl(3 * st); size = 0.75; align = right; active = 3 * st <= top }
draw Text { name = "ty4"; pos = (-6.8, py(4 * st)); text = tl(4 * st); size = 0.75; align = right; active = 4 * st <= top }
draw Text { name = "ty5"; pos = (-6.8, py(5 * st)); text = tl(5 * st); size = 0.75; align = right; active = 5 * st <= top }
draw Text { name = "ty6"; pos = (-6.8, py(6 * st)); text = tl(6 * st); size = 0.75; align = right; active = 6 * st <= top }
draw Text { name = "ty7"; pos = (-6.8, py(7 * st)); text = tl(7 * st); size = 0.75; align = right; active = 7 * st <= top }
draw Text { name = "tx0"; pos = (px(0 * kx), -4.15); text = format(0 * kx, 0); size = 0.75; active = 0 * kx <= n }
draw Text { name = "tx1"; pos = (px(1 * kx), -4.15); text = format(1 * kx, 0); size = 0.75; active = 1 * kx <= n }
draw Text { name = "tx2"; pos = (px(2 * kx), -4.15); text = format(2 * kx, 0); size = 0.75; active = 2 * kx <= n }
draw Text { name = "tx3"; pos = (px(3 * kx), -4.15); text = format(3 * kx, 0); size = 0.75; active = 3 * kx <= n }
draw Text { name = "tx4"; pos = (px(4 * kx), -4.15); text = format(4 * kx, 0); size = 0.75; active = 4 * kx <= n }
draw Text { name = "tx5"; pos = (px(5 * kx), -4.15); text = format(5 * kx, 0); size = 0.75; active = 5 * kx <= n }
draw Text { name = "tx6"; pos = (px(6 * kx), -4.15); text = format(6 * kx, 0); size = 0.75; active = 6 * kx <= n }
draw Text { name = "tx7"; pos = (px(7 * kx), -4.15); text = format(7 * kx, 0); size = 0.75; active = 7 * kx <= n }
draw Text { name = "tx8"; pos = (px(8 * kx), -4.15); text = format(8 * kx, 0); size = 0.75; active = 8 * kx <= n }
draw Text { name = "tx9"; pos = (px(9 * kx), -4.15); text = format(9 * kx, 0); size = 0.75; active = 9 * kx <= n }
draw Text { name = "tx10"; pos = (px(10 * kx), -4.15); text = format(10 * kx, 0); size = 0.75; active = 10 * kx <= n }
draw Text { name = "tx11"; pos = (px(11 * kx), -4.15); text = format(11 * kx, 0); size = 0.75; active = 11 * kx <= n }
draw Text { name = "tx12"; pos = (px(12 * kx), -4.15); text = format(12 * kx, 0); size = 0.75; active = 12 * kx <= n }
draw Text { name = "tCap"; pos = (-6.8, 4.5); text = "Pₙ(k)"; size = 0.85; align = left }
draw Text { name = "tK"; pos = (7.9, -4.15); text = "k"; size = 0.85; align = right }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 2; max = 60; step = 1; default = 20 }
new UI { name = "sP"; type = slider; label = "p"; variable = p; min = 0.05; max = 0.95; step = 0.05; default = 0.3 }
new UI { name = "sK"; type = slider; label = "k"; variable = k; min = 0; max = n; step = 1; default = 6 }
new UI { name = "sA"; type = select; label = "приближение"; variable = ap; options = ("none", "poi", "nrm"); labels = ("нет", "Пуассона", "Муавра — Лапласа"); default = "none" }

Function px(j) { return -6.6 + 14 * (j + 0.5) / (n + 1); }
Function py(v) { return -3.6 + 7.5 * v / top; }
Function tl(v) { if (st < 0.01) { return format(v, 3); } if (st < 0.1) { return format(v, 2); } return format(v, 1); }
Function lc(m, j) { float s = 0; repeat (j) { s = s + log((m - i) / (i + 1)); } return s; }
Function pk(m, j) { return exp(lc(m, j) + j * log(p) + (m - j) * log(1 - p)); }
Function poi(j) { float l = n * p; float s = -l; repeat (j) { s = s + log(l / (i + 1)); } return exp(s); }
Function nrm(j) { float sm = sqrt(n * p * (1 - p)); float x = (j - n * p) / sm; return exp(-x * x / 2) / (2.5066282746310002 * sm); }
Function appr(j) { if (ap == "poi") { return poi(j); } return nrm(j); }
Function sd(d) { if (d == 0) { return "⁰"; } if (d == 1) { return "¹"; } if (d == 2) { return "²"; } if (d == 3) { return "³"; } if (d == 4) { return "⁴"; } if (d == 5) { return "⁵"; } if (d == 6) { return "⁶"; } if (d == 7) { return "⁷"; } if (d == 8) { return "⁸"; } return "⁹"; }
Function sup(m) { if (m < 10) { return sd(m); } return sd(floor(m / 10)) + sd(m - 10 * floor(m / 10)); }
Function sg(x, d) { if (x < -0.5 * pow(10, -d)) { return "−" + format(-x, d); } return format(abs(x), d); }

Update {
  string kk = format(n, 0) + "|" + format(p, 2) + "|" + format(k, 0) + "|" + ap;
  if (kk != key) {
    key = kk;
    gb = newGraph(); ga = newGraph(); gg = newGraph();
    float pm = 0; float am = 0;
    repeat (n + 1) { pm = max(pm, pk(n, i)); if (ap != "none") { am = max(am, appr(i)); } }
    top = max(pm, am) * 1.05;
    st = 0.005; if (top > 0.03) { st = 0.01; } if (top > 0.06) { st = 0.02; } if (top > 0.15) { st = 0.05; } if (top > 0.35) { st = 0.1; } if (top > 0.7) { st = 0.2; }
    kx = 1; if (n > 12) { kx = 2; } if (n > 24) { kx = 5; }
    repeat (8) { if (i * st <= top) { addNode(gg, "a" + format(i, 0), [-6.6, py(i * st)]); addNode(gg, "b" + format(i, 0), [7.4, py(i * st)]); addEdge(gg, "a" + format(i, 0), "b" + format(i, 0)); } }
    repeat (n + 1) {
      string c = "#3b82f6"; if (i == k) { c = "#22c55e"; }
      addNode(gb, "p" + format(i, 0), [px(i), py(0)]); addNode(gb, "q" + format(i, 0), [px(i), py(pk(n, i))]); addEdge(gb, "p" + format(i, 0), "q" + format(i, 0), 1, c);
      if (ap != "none") { addNode(ga, "r" + format(i, 0), [px(i), py(appr(i))]); if (i > 0) { addEdge(ga, "r" + format(i - 1, 0), "r" + format(i, 0)); } }
    }
    mo = floor((n + 1) * p + 0.0000001);
  }
  float q = 1 - p; float pkk = pk(n, k); float mu = n * p; float sig = sqrt(n * p * q);
  string s = "**Схема Бернулли:** " + format(n, 0) + " независимых испытаний, в каждом успех с вероятностью p = " + format(p, 2) + " (неудача с q = " + format(q, 2) + "). Вероятность ровно k успехов — Pₙ(k) = C(n, k) · pᵏ · qⁿ⁻ᵏ.\n\n";
  s = s + "При k = " + format(k, 0) + ": Pₙ(k) = ";
  if (n <= 40) { s = s + format(exp(lc(n, k)), 0) + " · " + format(p, 2) + sup(k) + " · " + format(q, 2) + sup(n - k) + " = "; }
  s = s + format(pkk, 4) + ". Среднее число успехов np = " + format(mu, 2) + ", дисперсия npq = " + format(mu * q, 2) + ".\n\n";
  s = s + "Наиболее вероятное число успехов k₀ = ⌊(n + 1)p⌋ = " + format(mo, 0);
  if (abs((n + 1) * p - round((n + 1) * p)) < 0.000001) { s = s + " (и соседнее " + format(mo - 1, 0) + ": (n + 1)p целое, значения равны)"; }
  s = s + ", Pₙ(k₀) = " + format(pk(n, mo), 4) + ".";
  if (ap == "poi") { s = s + "\n\n**Приближение Пуассона** (оранжевое): при большом n и малом p биномиальное распределение близко к P(k) ≈ λᵏ · exp(−λ) / k!, где λ = np = " + format(mu, 2) + ". При k = " + format(k, 0) + ": " + format(poi(k), 4) + " против точного " + format(pkk, 4) + ".";
  }
  if (ap == "nrm") { s = s + "\n\n**Приближение Муавра — Лапласа** (оранжевое): при большом n и фиксированном p значение Pₙ(k) ≈ φ(x) / σ, где σ = √(npq) = " + format(sig, 2) + ", x = (k − np)/σ = " + sg((k - mu) / sig, 2) + ", φ — плотность стандартного нормального закона. При k = " + format(k, 0) + ": " + format(nrm(k), 4) + " против точного " + format(pkk, 4) + "."; }
  info = s;
}
]
