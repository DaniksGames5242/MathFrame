[
description = "{info}"

field width = 9;
field height = 6;
camera type = fixed;
show axes = true;
show grid = true;

// ---- Кривая ζ(σ + it), t ∈ [0; T], на комплексной плоскости (ось x — Re, ось y — Im) ----
// Если кривая проходит через начало координат, при этом t у ζ(σ + it) ноль.
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.8; color = #f59e0b }
new Curve { name = "zc"; type = parametric; x = "cre(t * T)"; y = "cim(t * T)"; segments = 900; color = #3b82f6; thickness = 2.5 }
new Point { name = "Z"; pos = (0, 0); dynamic = false; collision = false; text = true("ζ(s)"); color = #3b82f6 }

new UI { name = "sS"; type = slider; label = "σ = Re s"; variable = sigma; min = 0.1; max = 0.9; step = 0.01; default = 0.5 }
new UI { name = "sT"; type = slider; label = "T"; variable = T; min = 1; max = 30; step = 0.05; default = 14.13 }

// ---- Логика ----
float sigma = 0.5;
float T = 14.13;
float NB = 40;
float zr = 0; float zi = 0; float lastT = -1; float lastS = -1;
float dN = 0;
// Таблица ζ(σ + it) с шагом DT по t ∈ [0; 30] — пересчитывается только при смене σ;
// ползунок T лишь меняет видимую часть кривой (без повторных вычислений ζ).
float DT = 0.05; float M = 600; float cacheS = -1;
list tr = [0]; list ti = [0];
string info = "";

// Коэффициенты ускорения Борвейна для η(s) = Σ (−1)^(k) / (k+1)^s
Function dk(k) {
  float s = 0; float term = 1 / NB;
  repeat (k + 1) {
    // term = (n + i − 1)! · 4^i / ((n − i)! · (2i)!) — пересчёт от i − 1 к i
    if (i > 0) { term = term * (NB + i - 1) * 4 * (NB - i + 1) / ((2 * i - 1) * (2 * i)); }
    s = s + term;
  }
  return NB * s;
}
// ζ(σ + it) → (zr, zi); ζ = η / (1 − 2^(1−s))
Function zeta(t) {
  if (t == lastT && sigma == lastS) { return 0; }
  if (dN == 0) { dks = [0]; dks[0] = dk(0); repeat (NB) { push(dks, dk(i + 1)); } dN = dks[NB]; }
  float er = 0; float ei = 0; float dn = dN;
  repeat (NB) {
    float L = log(i + 1); float mag = exp(-sigma * L);
    float c = (dks[i] - dn) * mag; float sg = 1; if (i - 2 * floor(i / 2) == 1) { sg = -1; }
    er = er + sg * c * cos(t * L); ei = ei - sg * c * sin(t * L);
  }
  er = -er / dn; ei = -ei / dn;
  // знаменатель 1 − 2^(1−s) = 1 − 2^(1−σ)·(cos(t ln2) − i·sin(t ln2))
  float m = pow(2, 1 - sigma); float ar = 1 - m * cos(t * log(2)); float ai = m * sin(t * log(2));
  float den = ar * ar + ai * ai;
  zr = (er * ar + ei * ai) / den; zi = (ei * ar - er * ai) / den;
  lastT = t; lastS = sigma;
  return 0;
}
Function build() {
  tr = [0]; ti = [0]; zeta(0); tr[0] = zr; ti[0] = zi;
  repeat (M) { zeta((i + 1) * DT); push(tr, zr); push(ti, zi); }
  cacheS = sigma; return 0;
}
// Линейная интерполяция по таблице
Function cre(t) { if (cacheS < 0) { return 0; } float k = floor(t / DT); if (k >= M) { return tr[M]; } float f = t / DT - k; return tr[k] + (tr[k + 1] - tr[k]) * f; }
Function cim(t) { if (cacheS < 0) { return 0; } float k = floor(t / DT); if (k >= M) { return ti[M]; } float f = t / DT - k; return ti[k] + (ti[k + 1] - ti[k]) * f; }
Function sgn(v) { if (v < 0) { return " − "; } return " + "; }
Function zre(t) { zeta(t); return zr; }
Function zim(t) { zeta(t); return zi; }

Update {
  if (sigma != cacheS) { build(); }
  zeta(T); Z.pos.x = zr; Z.pos.y = zi;
  float mag = sqrt(zr * zr + zi * zi);
  info = "**Гипотеза Римана:** все нетривиальные нули дзета-функции ζ(s) лежат на прямой Re s = ½. Синяя кривая — образ отрезка вертикальной прямой s = σ + it (0 ≤ t ≤ T) при отображении ζ; ноль ζ — это момент, когда кривая проходит через начало координат (оранжевая точка).\n\nσ = " + format(sigma, 2) + ", T = " + format(T, 2) + ":   ζ(σ + iT) = " + format(zr, 3) + sgn(zi) + format(abs(zi), 3) + "i,   |ζ| = " + format(mag, 3) + ".";
  if (abs(sigma - 0.5) < 0.005) { info = info + "\n\nНа критической прямой кривая раз за разом проходит через 0 — при t ≈ 14,13, 21,02, 25,01, …"; }
  else { info = info + "\n\nВне прямой Re s = ½ петли обходят начало координат стороной: гипотеза утверждает, что так будет при любом T."; }
}
]
