[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Плотность f(x) выбранного непрерывного распределения (кривая). Две точки на оси задают отрезок [a; b]:
// вероятность P(a < X < b) — площадь под кривой над ним (синяя заливка). При a = b площадь, а с ней и
// вероятность одного значения, равна нулю. Функция распределения и моменты считаются по таблице интеграла плотности. ----
draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gF"; graph = "gf"; edgeWidth = 5; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gC"; graph = "gc"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
new Point { name = "L0"; pos = (-9.8, -5); dynamic = false; collision = false; active = false }
new Point { name = "L1"; pos = (9.8, -5); dynamic = false; collision = false; active = false }
new Line { name = "ax"; pos = (L0, L1); thickness = 1.5; interact = false; layer = 4 }
new Point { name = "PA"; line = "ax"; t = 0.3; pauseOnDrag = false; collideWithPoints = false; color = #3b82f6; layer = 50 }
new Point { name = "PB"; line = "ax"; t = 0.62; pauseOnDrag = false; collideWithPoints = false; color = #3b82f6; layer = 50 }
draw Text { name = "tlo"; pos = (lo, -5.75); text = num(lo, 1); size = 0.9; color = #3b82f6 }
draw Text { name = "thi"; pos = (hi, -5.75); text = num(hi, 1); size = 0.9; color = #3b82f6; active = hi - lo > 1.2 }
draw Text { name = "tm5"; pos = (-5, -5.75); text = "−5"; size = 0.9; active = abs(lo + 5) > 1.2 && abs(hi + 5) > 1.2 }
draw Text { name = "tz0"; pos = (0, -5.75); text = "0"; size = 0.9; active = abs(lo) > 1.2 && abs(hi) > 1.2 }
draw Text { name = "tp5"; pos = (5, -5.75); text = "5"; size = 0.9; active = abs(lo - 5) > 1.2 && abs(hi - 5) > 1.2 }
draw Text { name = "tf"; pos = (-9.6, 5.5); text = "f(x)"; size = 1; align = left }
draw Text { name = "tx"; pos = (9.6, -4.4); text = "x"; size = 0.9; align = right }

new UI { name = "sF"; type = select; label = "распределение"; variable = fam; options = ("norm", "unif", "expo", "mix"); labels = ("нормальное", "равномерное", "экспоненциальное", "смесь двух нормальных"); default = "norm" }

// ---- Логика ----
string fam = "norm"; string fkey = ""; float key = -1; float lo = -3; float hi = 3.2; float fac = 1; float built = 0;
float mu = 0; float dv = 0; float tot = 0; float area = 0; float lastx = 0; float lastb = 0;
list cf = [0]; list df = [0];
string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function gs(x, m, s) { return exp(-(x - m) * (x - m) / (2 * s * s)) / (s * 2.5066283); }
Function dens(x) {
  if (fam == "norm") { return gs(x, 0, 2); }
  if (fam == "unif") { if (abs(x + 4) < 0.001 || abs(x - 5) < 0.001) { return 1 / 18; } if (x > -4 && x < 5) { return 1 / 9; } return 0; }
  if (fam == "expo") { if (abs(x + 6) < 0.001) { return 0.25; } if (x > -6) { return 0.5 * exp(-0.5 * (x + 6)); } return 0; }
  return 0.5 * gs(x, -3, 1.2) + 0.5 * gs(x, 3.5, 1.8);
}
// интеграл плотности от −10 до x по таблице (шаг 0,05)
Function cdf(x) {
  float u = (min(max(x, -10), 10) + 10) / 0.05; float j = min(floor(u), 399);
  return cf[j] + (cf[j + 1] - cf[j]) * (u - j);
}

Update {
  if (built == 0) { repeat (400) { push(cf, 0); push(df, 0); } built = 1; }
  if (fkey != fam) {
    float pk = 0; float s1 = 0; float s2 = 0;
    repeat (401) { df[i] = dens(-10 + 0.05 * i); pk = max(pk, df[i]); }
    cf[0] = 0;
    repeat (400) { cf[i + 1] = cf[i] + 0.025 * (df[i] + df[i + 1]); }
    repeat (401) { s1 = s1 + (-10 + 0.05 * i) * df[i] * 0.05; }
    repeat (401) { s2 = s2 + (-10 + 0.05 * i - s1) * (-10 + 0.05 * i - s1) * df[i] * 0.05; }
    mu = s1; dv = s2; tot = cf[400]; fac = 9.5 / pk;
    gc = newGraph(); gg = newGraph();
    repeat (401) { addNode(gc, "c" + format(i, 0), [-10 + 0.05 * i, -5 + fac * df[i]]); }
    repeat (400) { addEdge(gc, "c" + format(i, 0), "c" + format(i + 1, 0)); }
    addNode(gg, "x1", [-5, -5]); addNode(gg, "x2", [-5, 5.2]); addEdge(gg, "x1", "x2");
    addNode(gg, "y1", [0, -5]); addNode(gg, "y2", [0, 5.2]); addEdge(gg, "y1", "y2");
    addNode(gg, "z1", [5, -5]); addNode(gg, "z2", [5, 5.2]); addEdge(gg, "z1", "z2");
    fkey = fam; key = -1;
  }
  lo = min(PA.pos.x, PB.pos.x); hi = max(PA.pos.x, PB.pos.x);
  if (key != round(lo * 20) * 1000 + round(hi * 20)) {
    gf = newGraph();
    repeat (round((hi - lo) / 0.1) + 1) {
      float x = min(lo + 0.1 * i, hi);
      addNode(gf, "u" + format(i, 0), [x, -5]); addNode(gf, "v" + format(i, 0), [x, -5 + fac * dens(x)]); addEdge(gf, "u" + format(i, 0), "v" + format(i, 0), 1, "#3b82f6");
    }
    area = cdf(hi) - cdf(lo);
    string nm = "нормальное N(0; 2²)";
    if (fam == "unif") { nm = "равномерное на [−4; 5]"; }
    if (fam == "expo") { nm = "экспоненциальное, λ = 0.5, сдвинутое на −6 (плотность 0 левее −6)"; }
    if (fam == "mix") { nm = "смесь ½N(−3; 1.2²) + ½N(3.5; 1.8²)"; }
    info = "**Непрерывное распределение:** " + nm + ". Плотность f(x) ≥ 0, полная площадь под кривой ∫f(x)dx = " + format(tot, 3) + " ≈ 1.\n\n**P(a < X < b) = ∫ₐᵇ f(x)dx = F(b) − F(a)** — площадь над отрезком [" + num(lo, 2) + "; " + num(hi, 2) + "]: " + format(cdf(hi), 3) + " − " + format(cdf(lo), 3) + " = **" + format(area, 3) + "**. Функция распределения F непрерывна.";
    if (hi - lo < 0.15) { info = info + " Отрезок стянулся в точку: **P(X = x) = 0** — вероятность одного значения равна нулю, хотя f(x) может быть положительной."; }
    info = info + "\n\n**Моменты:** E[X] = ∫x·f(x)dx = " + num(mu, 2) + ", D[X] = ∫(x − E[X])²·f(x)dx = " + format(dv, 2) + ".";
    key = round(lo * 20) * 1000 + round(hi * 20);
  }
}
]
