[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Многочлен g(x) = f(x + c) = a₃x³ + a₂x² + a₁x + a₀ (коэффициенты f и сдвиг c — ползунками).
// Таблица: для каждого простого p три условия критерия Эйзенштейна. ----
draw Text { name = "tf"; pos = (0, 4.2); text = "f(x) = " + poly(b3, b2, b1, b0); size = 1.3 }
draw Text { name = "tg"; pos = (0, 3.3); text = "g(x) = f(x + " + format(c, 0) + ") = " + poly(a3, a2, a1, a0); size = 1.3; color = #3b82f6; active = c != 0 }
draw Text { name = "h0"; pos = (-5.6, 2.2); text = "p"; size = 1.1; color = #6b7280 }
draw Text { name = "h1"; pos = (-2.9, 2.2); text = "p ∤ a₃"; size = 1.1; color = #6b7280 }
draw Text { name = "h2"; pos = (0.1, 2.2); text = "p | a₂, a₁, a₀"; size = 1.1; color = #6b7280 }
draw Text { name = "h3"; pos = (3.1, 2.2); text = "p² ∤ a₀"; size = 1.1; color = #6b7280 }
draw Graph { name = "gOk"; graph = "gok"; nodeColor = #22c55e; nodeRadius = 11; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gNo"; graph = "gno"; nodeColor = #ef4444; nodeRadius = 11; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gRow"; graph = "grow"; nodeColor = #22c55e; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "pr0"; pos = (-5.6, 1.3); text = "2"; size = 1.2 }
draw Text { name = "pr1"; pos = (-5.6, 0.45); text = "3"; size = 1.2 }
draw Text { name = "pr2"; pos = (-5.6, -0.4); text = "5"; size = 1.2 }
draw Text { name = "pr3"; pos = (-5.6, -1.25); text = "7"; size = 1.2 }
draw Text { name = "pr4"; pos = (-5.6, -2.1); text = "11"; size = 1.2 }
draw Text { name = "pr5"; pos = (-5.6, -2.95); text = "13"; size = 1.2 }

new UI { name = "s3"; type = slider; label = "b₃"; variable = b3; min = -6; max = 6; step = 1; default = 1 }
new UI { name = "s2"; type = slider; label = "b₂"; variable = b2; min = -12; max = 12; step = 1; default = 2 }
new UI { name = "s1"; type = slider; label = "b₁"; variable = b1; min = -12; max = 12; step = 1; default = 4 }
new UI { name = "s0"; type = slider; label = "b₀"; variable = b0; min = -12; max = 12; step = 1; default = 6 }
new UI { name = "sc"; type = slider; label = "сдвиг c"; variable = c; min = -3; max = 3; step = 1; default = 0 }

// ---- Логика ----
float b3 = 1; float b2 = 2; float b1 = 4; float b0 = 6; float c = 0;
float a3 = 1; float a2 = 2; float a1 = 4; float a0 = 6;
string info = "";

Function md(a, m) { return a - floor(a / m) * m; }
Function dv(p, a) { return md(a, p) == 0; }
Function term(k, v, first) {
  if (v == 0) { return ""; }
  string s = "";
  if (v < 0) { if (first == 1) { s = "−"; } else { s = " − "; } } else { if (first == 0) { s = " + "; } }
  float av = abs(v);
  if (av != 1 || k == 0) { s = s + format(av, 0); }
  if (k == 1) { s = s + "x"; } if (k == 2) { s = s + "x²"; } if (k == 3) { s = s + "x³"; }
  return s;
}
Function poly(p3, p2, p1, p0) {
  string s = term(3, p3, 1); float f = 1; if (p3 != 0) { f = 0; }
  s = s + term(2, p2, f); if (p2 != 0) { f = 0; }
  s = s + term(1, p1, f); if (p1 != 0) { f = 0; }
  s = s + term(0, p0, f); if (s == "") { s = "0"; }
  return s;
}
Function ev(x) { return ((b3 * x + b2) * x + b1) * x + b0; }

Update {
  if (b3 == 0) { b3 = 1; }
  // g(x) = f(x + c): коэффициенты по формуле Тейлора
  a3 = b3; a2 = 3 * b3 * c + b2; a1 = 3 * b3 * c * c + 2 * b2 * c + b1; a0 = b3 * c * c * c + b2 * c * c + b1 * c + b0;
  gok = newGraph(); gno = newGraph(); grow = newGraph();
  float good = 0; float gp = 0;

  if (!dv(2, a3)) { addNode(gok, "a0", [-2.9, 1.3]); } else { addNode(gno, "a0", [-2.9, 1.3]); }
  if (dv(2, a2) && dv(2, a1) && dv(2, a0)) { addNode(gok, "b0", [0.1, 1.3]); } else { addNode(gno, "b0", [0.1, 1.3]); }
  if (!dv(4, a0)) { addNode(gok, "c0", [3.1, 1.3]); } else { addNode(gno, "c0", [3.1, 1.3]); }
  if (!dv(2, a3) && dv(2, a2) && dv(2, a1) && dv(2, a0) && !dv(4, a0)) { good = 1; gp = 2; addNode(grow, "r0", [-5.6, 1.3]); }
  if (!dv(3, a3)) { addNode(gok, "a1", [-2.9, 0.45]); } else { addNode(gno, "a1", [-2.9, 0.45]); }
  if (dv(3, a2) && dv(3, a1) && dv(3, a0)) { addNode(gok, "b1", [0.1, 0.45]); } else { addNode(gno, "b1", [0.1, 0.45]); }
  if (!dv(9, a0)) { addNode(gok, "c1", [3.1, 0.45]); } else { addNode(gno, "c1", [3.1, 0.45]); }
  if (!dv(3, a3) && dv(3, a2) && dv(3, a1) && dv(3, a0) && !dv(9, a0)) { good = 1; gp = 3; addNode(grow, "r1", [-5.6, 0.45]); }
  if (!dv(5, a3)) { addNode(gok, "a2", [-2.9, -0.4]); } else { addNode(gno, "a2", [-2.9, -0.4]); }
  if (dv(5, a2) && dv(5, a1) && dv(5, a0)) { addNode(gok, "b2", [0.1, -0.4]); } else { addNode(gno, "b2", [0.1, -0.4]); }
  if (!dv(25, a0)) { addNode(gok, "c2", [3.1, -0.4]); } else { addNode(gno, "c2", [3.1, -0.4]); }
  if (!dv(5, a3) && dv(5, a2) && dv(5, a1) && dv(5, a0) && !dv(25, a0)) { good = 1; gp = 5; addNode(grow, "r2", [-5.6, -0.4]); }
  if (!dv(7, a3)) { addNode(gok, "a3", [-2.9, -1.25]); } else { addNode(gno, "a3", [-2.9, -1.25]); }
  if (dv(7, a2) && dv(7, a1) && dv(7, a0)) { addNode(gok, "b3", [0.1, -1.25]); } else { addNode(gno, "b3", [0.1, -1.25]); }
  if (!dv(49, a0)) { addNode(gok, "c3", [3.1, -1.25]); } else { addNode(gno, "c3", [3.1, -1.25]); }
  if (!dv(7, a3) && dv(7, a2) && dv(7, a1) && dv(7, a0) && !dv(49, a0)) { good = 1; gp = 7; addNode(grow, "r3", [-5.6, -1.25]); }
  if (!dv(11, a3)) { addNode(gok, "a4", [-2.9, -2.1]); } else { addNode(gno, "a4", [-2.9, -2.1]); }
  if (dv(11, a2) && dv(11, a1) && dv(11, a0)) { addNode(gok, "b4", [0.1, -2.1]); } else { addNode(gno, "b4", [0.1, -2.1]); }
  if (!dv(121, a0)) { addNode(gok, "c4", [3.1, -2.1]); } else { addNode(gno, "c4", [3.1, -2.1]); }
  if (!dv(11, a3) && dv(11, a2) && dv(11, a1) && dv(11, a0) && !dv(121, a0)) { good = 1; gp = 11; addNode(grow, "r4", [-5.6, -2.1]); }
  if (!dv(13, a3)) { addNode(gok, "a5", [-2.9, -2.95]); } else { addNode(gno, "a5", [-2.9, -2.95]); }
  if (dv(13, a2) && dv(13, a1) && dv(13, a0)) { addNode(gok, "b5", [0.1, -2.95]); } else { addNode(gno, "b5", [0.1, -2.95]); }
  if (!dv(169, a0)) { addNode(gok, "c5", [3.1, -2.95]); } else { addNode(gno, "c5", [3.1, -2.95]); }
  if (!dv(13, a3) && dv(13, a2) && dv(13, a1) && dv(13, a0) && !dv(169, a0)) { good = 1; gp = 13; addNode(grow, "r5", [-5.6, -2.95]); }
  // Настоящая проверка: кубический многочлен приводим над ℚ ⇔ у него есть рациональный корень d/e (d | b₀, e | b₃)
  float root = 0; string rs = "";
  if (b0 == 0) { root = 1; rs = "0"; }
  else {
    repeat (abs(b0)) { float d = i + 1; if (dv(d, b0)) { repeat (abs(b3)) { float e = i + 1; if (dv(e, b3)) {
      if (root == 0 && ev(d / e) == 0) { root = 1; rs = format(d, 0); if (e > 1) { rs = rs + "/" + format(e, 0); } }
      if (root == 0 && ev(-d / e) == 0) { root = 1; rs = "−" + format(d, 0); if (e > 1) { rs = rs + "/" + format(e, 0); } }
    } } } }
  }
  info = "**Критерий Эйзенштейна:** многочлен aₙxⁿ + … + a₁x + a₀ с целыми коэффициентами неприводим над ℚ, если есть простое p, которое не делит aₙ, делит все остальные коэффициенты, а p² не делит a₀. Это лишь **достаточное** условие.\n\n";
  if (good == 1) { info = info + "**Условия выполнены при p = " + format(gp, 0) + "** (строка выделена) — многочлен неприводим."; }
  else { info = info + "Ни одно простое p ≤ 13 не подходит — критерий ничего не говорит."; }
  info = info + " Проверка напрямую: кубический многочлен приводим над ℚ тогда и только тогда, когда у него есть рациональный корень; ";
  if (root == 1) { info = info + "здесь корень x = " + rs + " — **f приводим**."; } else { info = info + "рациональных корней нет — **f неприводим**."; }
  if (good == 0 && root == 0) { info = info + " Попробуйте сдвиг c: f(x) и f(x + c) неприводимы одновременно, а к сдвинутому критерий может оказаться применим."; }
}
]
