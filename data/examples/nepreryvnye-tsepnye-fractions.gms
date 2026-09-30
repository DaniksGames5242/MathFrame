[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Алгоритм Евклида для x и 1 геометрически: прямоугольник x × 1 режется на наибольшие
// квадраты. Число квадратов первого уровня — a₀, второго — a₁ и т. д.; серый остаток — ещё
// не разобранная часть. Подходящие дроби — в описании. ----
draw Graph { name = "gB"; graph = "gb"; edgeColor = #3b82f6; edgeWidth = 2; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gY"; graph = "gy"; edgeColor = #f59e0b; edgeWidth = 2; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gG"; graph = "gg"; edgeColor = #3b82f699; edgeWidth = 1; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }

new UI { type = slider; label = "x"; variable = x; min = 1; max = 10; step = 0.001; default = 3.245 }
new UI { type = slider; label = "неполных частных"; variable = k; min = 1; max = 8; step = 1; default = 4 }
new UI { type = button; label = "√2"; action = "x = 1.414213562" }
new UI { type = button; label = "φ"; action = "x = 1.618033989" }
new UI { type = button; label = "e"; action = "x = 2.718281828" }
new UI { type = button; label = "π"; action = "x = 3.141592654" }

float x = 3.245; float k = 4; float D = 1000000000; float N = 3245000000; float key = -1; float nn = 0; string info = "";

Function md(v, q) { return v - q * floor(v / q); }
// остатки алгоритма Евклида: r₀ = N, r₁ = D, r₍ⱼ₊₁₎ = r₍ⱼ₋₁₎ mod rⱼ
Function rr(j) { float a = N; float b = D; repeat (j) { float t = md(a, b); a = b; b = t; } return a; }
Function aq(j) { return floor(rr(j) / rr(j + 1)); }
Function terms() { float t = 0; repeat (30) { if (rr(i + 1) > 0) { t = t + 1; } } return t; }
// числитель (w = 0) и знаменатель (w = 1) подходящей дроби номера j; p₋₁ = 1, q₋₁ = 0
Function cv(j, w) {
  if (j < 0) { return 1 - w; }
  float p1 = 1; float q1 = 0; float p = aq(0); float q = 1;
  repeat (j) { float t = aq(i + 1) * p + p1; p1 = p; p = t; t = aq(i + 1) * q + q1; q1 = q; q = t; }
  if (w == 0) { return p; } return q;
}
Function seg(g, x1, y1, x2, y2) {
  nn = nn + 1; string s1 = "a" + format(nn, 0); string s2 = "b" + format(nn, 0);
  addNode(g, s1, [x1, y1]); addNode(g, s2, [x2, y2]); addEdge(g, s1, s2);
}
Function box(g, x1, y1, x2, y2) { seg(g, x1, y1, x2, y1); seg(g, x2, y1, x2, y2); seg(g, x2, y2, x1, y2); seg(g, x1, y2, x1, y1); }
Function cfs(m) {
  string s = "[" + format(aq(0), 0); float t = terms();
  repeat (m - 1) { if (i + 1 < t) { s = s + (i == 0 ? "; " : ", ") + format(aq(i + 1), 0); } }
  if (t > m) { s = s + ", …"; }
  return s + "]";
}

Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }

// уровень lv: c квадратов со стороной s; чётные ряды идут вдоль x, нечётные — вдоль y
Function level(g, lv, x0, y0, c, s) {
  if (md(lv, 2) == 0) {
    box(g, x0, y0, x0 + c * s, y0 + s);
    if (c < 61) { repeat (c - 1) { seg(g, x0 + (i + 1) * s, y0, x0 + (i + 1) * s, y0 + s); } }
  }
  if (md(lv, 2) == 1) {
    box(g, x0, y0, x0 + s, y0 + c * s);
    if (c < 61) { repeat (c - 1) { seg(g, x0, y0 + (i + 1) * s, x0 + s, y0 + (i + 1) * s); } }
  }
}

Update {
  N = round(x * 1000000000);
  float T = terms(); float kk = min(k, T);
  if (key != N * 10 + k) {
    gb = newGraph(); gy = newGraph(); gg = newGraph(); nn = 0;
    float sc = min(15.4 / x, 9.4); float u = sc / D;
    float x0 = -x * sc / 2; float y0 = -sc / 2; float w = N * u; float h = D * u;
    repeat (kk) {
      float lv = i; float c = aq(lv); float s = rr(lv + 1) * u;
      if (md(lv, 2) == 0) { level(gb, lv, x0, y0, c, s); x0 = x0 + c * s; w = w - c * s; }
      if (md(lv, 2) == 1) { level(gy, lv, x0, y0, c, s); y0 = y0 + c * s; h = h - c * s; }
    }
    if (kk < T) { box(gg, x0, y0, x0 + w, y0 + h); }
    key = N * 10 + k;
  }
  float ad = 3; if (md(N, 1000000) != 0) { ad = 9; }
  float j = kk - 1; float pj = cv(j, 0); float qj = cv(j, 1); float err = x - pj / qj;
  info = "**Непрерывная дробь** x = a₀ + 1/(a₁ + 1/(a₂ + …)) числа x = **" + format(x, ad) + "**: **" + cfs(kk) + "**, aᵢ — неполные частные. ";
  info = info + "Число задано десятичной дробью, поэтому разложение конечно и получено алгоритмом Евклида (у иррационального числа оно бесконечно, а первые частные те же, что у его точного десятичного приближения). ";
  info = info + "Геометрически aᵢ — число квадратов i-го уровня в разрезании прямоугольника x × 1: " + format(aq(0), 0) + " синих квадратов первого уровня, затем жёлтых и т. д.\n\n";
  info = info + "Подходящие дроби pₙ/qₙ, pₙ = aₙ·pₙ₋₁ + pₙ₋₂, qₙ = aₙ·qₙ₋₁ + qₙ₋₂ (p₋₁ = 1, q₋₁ = 0): ";
  repeat (kk) { info = info + format(cv(i, 0), 0) + "/" + format(cv(i, 1), 0); if (i < kk - 1) { info = info + ", "; } }
  info = info + ".";
  if (j > 0) { info = info + " При n = " + format(j, 0) + ": pₙ = " + format(aq(j), 0) + "·" + format(cv(j - 1, 0), 0) + " + " + format(cv(j - 2, 0), 0) + " = " + format(pj, 0) + ", qₙ = " + format(aq(j), 0) + "·" + format(cv(j - 1, 1), 0) + " + " + format(cv(j - 2, 1), 0) + " = " + format(qj, 0) + "."; }
  info = info + "\n\nПодходящая дробь **" + format(pj, 0) + "/" + format(qj, 0) + "** ≈ " + format(pj / qj, 9) + ", погрешность x − pₙ/qₙ = " + num(err, 9) + ", а 1/qₙ² = " + format(1 / (qj * qj), 9) + ". ";
  if (md(j, 2) == 0) { info = info + "Дроби с чётным номером лежат не выше x, с нечётным — не ниже: приближения чередуются."; }
  if (md(j, 2) == 1) { info = info + "Дроби с нечётным номером лежат не ниже x, с чётным — не выше: приближения чередуются."; }
  if (kk == T) { info = info + " Все частные использованы: подходящая дробь равна x."; }
}
]
