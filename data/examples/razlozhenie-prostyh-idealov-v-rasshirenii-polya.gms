[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Простые числа p — простые идеалы кольца ℤ. В квадратичном расширении ℚ(√d) (кольцо ℤ[√d]) идеал (p) либо
// раскладывается на два различных простых (зелёные), либо остаётся простым (синие), либо становится квадратом (оранжевые). ----
draw Graph { name = "gS"; graph = "gs"; nodeColor = #22c55e; nodeRadius = 21; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gI"; graph = "gi"; nodeColor = #3b82f6; nodeRadius = 21; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gR"; graph = "gr"; nodeColor = #f59e0b; nodeRadius = 21; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gSel"; graph = "gsel"; nodeColor = #3b82f6; nodeRadius = 27; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "k1"; pos = (-7.6, 4.5); text = "простые p:"; size = 1; align = left }
draw Text { name = "k2"; pos = (-7.6, -3.7); text = "● (p) = 𝔭₁𝔭₂ — разлагается"; size = 0.95; align = left; color = #22c55e }
draw Text { name = "k3"; pos = (-7.6, -4.3); text = "● (p) = 𝔭 — остаётся простым"; size = 0.95; align = left; color = #3b82f6 }
draw Text { name = "k4"; pos = (0.4, -3.7); text = "● (p) = 𝔭² — ветвится"; size = 0.95; align = left; color = #f59e0b }

new UI { name = "sD"; type = select; label = "d"; variable = d; options = (-1, -2, -5, 2, 3, 6, 7); labels = ("ℚ(i)", "ℚ(√−2)", "ℚ(√−5)", "ℚ(√2)", "ℚ(√3)", "ℚ(√6)", "ℚ(√7)"); default = -1 }
new UI { name = "sK"; type = slider; label = "простое №"; variable = k; min = 1; max = 20; step = 1; default = 3 }

// ---- Логика ----
float d = -1; float k = 3;
string info = "";

Function md(m, r) { return m - floor(m / r) * r; }
Function num(x) { if (x < 0) { return "−" + format(-x, 0); } return format(x, 0); }
Function isPrime(n) { if (n < 2) { return 0; } float ok = 1; repeat (12) { float t = i + 2; if (t * t <= n && md(n, t) == 0) { ok = 0; } } return ok; }
// корень x из d по модулю p (−1, если нет); для p | d возвращает 0
Function root(p) { float r = -1; repeat (p) { if (r < 0 && md(i * i - d, p) == 0) { r = i; } } return r; }
// 0 — разлагается, 1 — остаётся простым, 2 — ветвится
Function kind(p) { if (p == 2 || md(d, p) == 0) { return 2; } if (root(p) >= 0) { return 0; } return 1; }
Function px(j) { return -6.4 + 1.4 * md(j, 10); }
Function py(j) { return 3.0 - 2.2 * floor(j / 10); }
Function sq() { if (d == -1) { return "i"; } return "√" + num(d); }
Function gen(p) { if (kind(p) == 2) { if (md(d, p) == 0) { return "(p, " + sq() + ")"; } return "(2, 1 + " + sq() + ")"; } return "(p, " + num(root(p)) + " ± " + sq() + ")"; }

Update {
  float c = 0; float n = 1; gs = newGraph(); gi = newGraph(); gr = newGraph(); gsel = newGraph();
  repeat (80) { n = n + 1;
    if (c < 20 && isPrime(n) == 1) { addNode(kind(n) == 0 ? gs : (kind(n) == 1 ? gi : gr), format(n, 0), [px(c), py(c)]); if (c == k - 1) { addNode(gsel, "sel", [px(c), py(c)]); } c = c + 1; }
  }
  float p = 2; float cc = 0; n = 1;
  repeat (80) { n = n + 1; if (cc < k && isPrime(n) == 1) { p = n; cc = cc + 1; } }
  float t = kind(p);
  info = "**Разложение простого идеала в расширении:** простой идеал (p) кольца ℤ в кольце целых поля ℚ(√" + num(d) + ") раскладывается в произведение простых идеалов, единственным образом. Показатели вхождения eᵢ и степени fᵢ (норма 𝔭ᵢ равна p в степени fᵢ) связаны равенством Σ eᵢ·fᵢ = 2 — степени расширения.\n\n";
  if (t == 0) { info = info + "**p = " + format(p, 0) + " разлагается:** d ≡ " + format(root(p), 0) + "² (mod " + format(p, 0) + "), поэтому (" + format(p, 0) + ") = 𝔭₁𝔭₂ с 𝔭₁ = (" + format(p, 0) + ", " + num(root(p)) + " − " + sq() + "), 𝔭₂ = (" + format(p, 0) + ", " + num(root(p)) + " + " + sq() + "). Это неветвящийся случай: e = 1, f = 1, N(𝔭ᵢ) = " + format(p, 0) + ", сумма 1 + 1 = 2."; }
  if (t == 1) { info = info + "**p = " + format(p, 0) + " остаётся простым:** d не является квадратом по модулю " + format(p, 0) + ", идеал (" + format(p, 0) + ") прост, e = 1, f = 2, N = " + format(p, 0) + "² = " + format(p * p, 0) + ", сумма 1·2 = 2."; }
  if (t == 2) { info = info + "**p = " + format(p, 0) + " ветвится:** (" + format(p, 0) + ") = 𝔭² с 𝔭 = " + gen(p) + ", e = 2, f = 1, N(𝔭) = " + format(p, 0) + ", сумма 2·1 = 2. Ветвятся лишь простые, делящие дискриминант поля."; }
  info = info + "\n\nПри выборе поля учтены d ≡ 2, 3 (mod 4): кольцо целых поля — ℤ[√d].";
}
]
