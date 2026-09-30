[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// Плотности Γ(k₁; λ) — синяя, Γ(k₂; λ) — зелёная, Γ(k₁ + k₂; λ) — жёлтая. Ось x: 1 единица = 1 поле (x от 0 до 20).
// Точка A задаёт x; вертикаль — значение плотности суммы в x.
float k1 = 2; float k2 = 3; float lam = 1; float y0 = -4.5; float ky = 6;
float key = -99; float xv = 4; float cv = 0; float fs = 0;
string info = "";

Function fg(x, k, l) { return pow(l, k) * pow(x, k - 1) * exp(-l * x) / gamma(k); }
func g1(X) = y0 + min(ky * fg(X + 10, k1, lam), 10.4);
func g2(X) = y0 + min(ky * fg(X + 10, k2, lam), 10.4);
func g3(X) = y0 + min(ky * fg(X + 10, k1 + k2, lam), 10.4);
draw Function { name = "f1"; f = "g1"; xmin = -10; xmax = 10; thickness = 3; color = #3b82f6; layer = 30 }
draw Function { name = "f2"; f = "g2"; xmin = -10; xmax = 10; thickness = 3; color = #22c55e; layer = 30 }
draw Function { name = "f3"; f = "g3"; xmin = -10; xmax = 10; thickness = 3; color = #f59e0b; layer = 31 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f677; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gM"; graph = "gm"; nodeRadius = 0; edgeWidth = 2; labels = false; interactive = false; showWeights = false; layer = 40 }
new Point { name = "A"; pos = (-6, -4.5); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
draw Text { name = "tX"; pos = (A.pos.x, y0 - 1.1); text = "x"; size = 0.95; color = #f59e0b }
draw Text { name = "x0"; pos = (-9.6, y0 - 0.55); text = "0"; size = 0.7 }
draw Text { name = "x1"; pos = (-5, y0 - 0.55); text = "5"; size = 0.7 }
draw Text { name = "x2"; pos = (0, y0 - 0.55); text = "10"; size = 0.7 }
draw Text { name = "x3"; pos = (5, y0 - 0.55); text = "15"; size = 0.7 }
draw Text { name = "x4"; pos = (9.5, y0 - 0.55); text = "20"; size = 0.7 }

new UI { type = slider; label = "k₁ (форма)"; variable = k1; min = 1; max = 4; step = 0.5; default = 2 }
new UI { type = slider; label = "k₂ (форма)"; variable = k2; min = 1; max = 4; step = 0.5; default = 3 }
new UI { type = slider; label = "λ (интенсивность)"; variable = lam; min = 0.5; max = 3; step = 0.1; default = 1 }

// свёртка (f₁ ∗ f₂)(x) = ∫ от 0 до x от f₁(t)·f₂(x − t) dt, формула Симпсона
Function conv(x) {
  float h = x / 200; float s = fg(0.000001, k1, lam) * fg(x - 0.000001, k2, lam) + fg(x - 0.000001, k1, lam) * fg(0.000001, k2, lam);
  repeat (199) { float t = h * (i + 1); float w = 4; if (i - 2 * floor(i / 2) == 1) { w = 2; } s = s + w * fg(t, k1, lam) * fg(x - t, k2, lam); }
  return s * h / 3;
}
Function pk(k) { return fg((k - 1) / lam, k, lam); }
Update {
  if (abs(A.pos.y - y0) > 0.0001) { A.pos.y = y0; }
  if (A.pos.x < -9.5) { A.pos.x = -9.5; }
  if (A.pos.x > 9.5) { A.pos.x = 9.5; }
  xv = A.pos.x + 10;
  ky = 6.5 / max(pk(k1), max(pk(k2), pk(k1 + k2)));
  if (key != A.pos.x * 100 + k1 * 0.1 + k2 * 0.001 + lam * 0.00001) {
    ga = newGraph(); gm = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    repeat (5) { float tx = -10 + 5 * i; addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0)); }
    fs = fg(xv, k1 + k2, lam); cv = conv(xv);
    addNode(gm, "p", [A.pos.x, y0]); addNode(gm, "q", [A.pos.x, y0 + min(10.4, ky * fs)]); addEdge(gm, "p", "q", 1, "#f59e0b");
    key = A.pos.x * 100 + k1 * 0.1 + k2 * 0.001 + lam * 0.00001;
  }
  info = "**Гамма-распределение** Γ(k; λ) с параметром формы k и интенсивностью λ = **" + format(lam, 1) + "** (масштаб 1/λ = " + format(1 / lam, 2) + "): плотность λᵏ·xᵏ⁻¹·e^(−λx)/Γ(k) при x > 0, среднее k/λ, дисперсия k/λ², асимметрия 2/√k > 0 убывает с ростом k. При k = 1 это показательное распределение.\n\n";
  info = info + "Синяя: k₁ = **" + format(k1, 1) + "**, среднее " + format(k1 / lam, 2) + ". Зелёная: k₂ = **" + format(k2, 1) + "**, среднее " + format(k2 / lam, 2) + ". Изменение λ только растягивает кривые по x, форма определяется k.\n\n";
  info = info + "**Сумма независимых** Γ(k₁; λ) и Γ(k₂; λ) — снова гамма с тем же λ и k₁ + k₂ = **" + format(k1 + k2, 1) + "** (жёлтая). Проверка при x = **" + format(xv, 2) + "**: свёртка плотностей ∫ f₁(t)·f₂(x − t) dt = **" + format(cv, 4) + "**, плотность Γ(k₁ + k₂; λ) в x = **" + format(fs, 4) + "**.";
}
]
