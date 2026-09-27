[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Точное распределение нормированной суммы Zₙ = (Sₙ − nμ)/(σ√n) n независимых
// одинаково распределённых величин (столбики — вероятности, пересчитанные в плотность)
// и плотность стандартного нормального закона (оранжевая). Ось x — значения Zₙ. ----
new Point { name = "A0"; pos = (-7.6, -4); dynamic = false; collision = false; active = false }
new Point { name = "A1"; pos = (7.6, -4); dynamic = false; collision = false; active = false }
new Line { name = "ax"; pos = (A0, A1); thickness = 1.5; interact = false }
draw Graph { name = "gBars"; graph = "gb"; edgeColor = #3b82f6; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gTops"; graph = "gt"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 11 }
new Curve { name = "nrm"; type = parametric; x = "zx(-4.2 + 8.4 * t)"; y = "-4 + 18 * exp(-(-4.2 + 8.4 * t) ^ 2 / 2) / sqrt(2 * pi)"; segments = 200; color = #f59e0b; thickness = 3; layer = 20 }
draw Text { name = "z0"; pos = (zx(0), -4.4); text = "0"; size = 0.9 }
draw Text { name = "z1"; pos = (zx(-2), -4.4); text = "−2"; size = 0.9 }
draw Text { name = "z2"; pos = (zx(2), -4.4); text = "2"; size = 0.9 }
draw Text { name = "z3"; pos = (zx(-4), -4.4); text = "−4"; size = 0.9 }
draw Text { name = "z4"; pos = (zx(4), -4.4); text = "4"; size = 0.9 }
// Слева вверху — распределение одного слагаемого
draw Graph { name = "gOne"; graph = "g1"; edgeColor = #22c55e; edgeWidth = 8; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "one"; pos = (-5.9, 4.5); text = "одно слагаемое X"; size = 0.9; color = #22c55e }

new UI { name = "sD"; type = select; label = "X"; variable = dist; options = ("die", "skew", "coin", "two"); labels = ("честная кость 1…6", "кость с перекосом", "0/1 с P(1) = 0.1", "только 1 или 6"); default = "skew" }
new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 1; max = 40; step = 1; default = 3 }

// ---- Логика ----
string dist = "skew"; string lastD = "";
float n = 3; float lastN = 0;
float mu = 0; float sig = 1; float dmax = 0;
list pr = (0, 0, 0, 0, 0, 0);
list P = (1);
list Q = (1);
string info = "";

Function zx(z) { return 1.8 * z; }
Function Phi(z) {
  // функция Лапласа через erf (приближение Абрамовица — Стегуна)
  float t = 1 / (1 + 0.3275911 * abs(z) / sqrt(2));
  float e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-z * z / 2);
  if (z < 0) { return 0.5 * (1 - e); } return 0.5 * (1 + e);
}

Update {
  if (dist != lastD || n != lastN) {
    // Значения слагаемого — 1…6 (для монеты — 0/1)
    repeat (6) { pr[i] = 0; }
    if (dist == "die") { repeat (6) { pr[i] = 1 / 6; } }
    if (dist == "skew") { pr[0] = 0.5; pr[1] = 0.25; pr[2] = 0.1; pr[3] = 0.07; pr[4] = 0.05; pr[5] = 0.03; }
    if (dist == "coin") { pr[0] = 0.9; pr[1] = 0.1; }
    if (dist == "two") { pr[0] = 0.5; pr[5] = 0.5; }
    float off = 1; if (dist == "coin") { off = 0; }
    mu = 0; float m2 = 0;
    repeat (6) { mu = mu + (i + off) * pr[i]; m2 = m2 + (i + off) ^ 2 * pr[i]; }
    sig = sqrt(m2 - mu * mu);
    // Свёртка: распределение суммы значений (i) — сдвиг на n·off учтём в конце
    P = [1];
    repeat (n) {
      Q = [0]; repeat (len(P) + 4) { push(Q, 0); }
      repeat (len(P)) { float a = i; repeat (6) { Q[a + i] = Q[a + i] + P[a] * pr[i]; } }
      P = Q;
    }
    gb = newGraph(); gt = newGraph();
    float sc = sig * sqrt(n);
    float cum = 0; dmax = 0;
    repeat (len(P)) {
      float s = i + n * off;
      float z = (s - n * mu) / sc;
      if (P[i] > 0.0000001 && abs(z) < 4.3) {
        float h = P[i] * sc;
        string k = format(i, 0);
        addNode(gb, "a" + k, [zx(z), -4]); addNode(gb, "b" + k, [zx(z), -4 + 18 * h]); addEdge(gb, "a" + k, "b" + k);
        addNode(gt, "t" + k, [zx(z), -4 + 18 * h]);
      }
      // Колмогоровское расстояние до нормального закона: max |Fₙ − Φ|
      dmax = max(dmax, abs(cum - Phi(z)));
      cum = cum + P[i];
      dmax = max(dmax, abs(cum - Phi(z)));
    }
    g1 = newGraph();
    repeat (6) { if (pr[i] > 0) { string k = format(i, 0); addNode(g1, "a" + k, [-7.3 + 0.55 * i, 2.8]); addNode(g1, "b" + k, [-7.3 + 0.55 * i, 2.8 + 3 * pr[i]]); addEdge(g1, "a" + k, "b" + k); } }
    lastD = dist; lastN = n;
  }
  info = "**Центральная предельная теорема:** если X₁, X₂, … независимы, одинаково распределены, с математическим ожиданием μ и дисперсией σ² > 0, то распределение нормированной суммы Zₙ = (X₁ + … + Xₙ − nμ)/(σ√n) при n → ∞ стремится к стандартному нормальному N(0, 1) — каким бы ни было распределение одного слагаемого.\n\nμ = " + format(mu, 2) + ", σ = " + format(sig, 2) + ", n = " + format(n, 0) + ":   наибольшее расхождение функций распределения max |P(Zₙ ≤ z) − Φ(z)| = " + format(dmax, 3) + ".";
  if (dist == "skew" || dist == "coin") { info = info + " У несимметричного слагаемого асимметрия суммы убывает как 1/√n — сходимость медленнее."; }
  if (dist == "two") { info = info + " Даже «двугорбое» слагаемое уже при небольших n даёт колокол."; }
}
]
