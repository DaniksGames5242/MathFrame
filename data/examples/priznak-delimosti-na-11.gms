[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Цифры числа N (клик по цифре увеличивает её на 1). Под каждой — остаток 10ᵏ при делении
// на 11: +1 для чётных позиций справа (синие), −1 для нечётных (оранжевые), потому что 10 ≡ −1. ----
draw Graph { name = "gP"; graph = "gp"; nodeColor = #3b82f6; nodeRadius = 30; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gM"; graph = "gm"; nodeColor = #f59e0b; nodeRadius = 30; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "d0"; pos = (dx(0), 1.2); text = dig(0); size = 2.4; layer = 10; active = 0 < len1 }
draw Text { name = "w0"; pos = (dx(0), 0.1); text = wt(0); size = 1.2; layer = 10; active = 0 < len1 }
draw Text { name = "p0"; pos = (dx(0), -0.6); text = "10" + sup(0); size = 0.9; color = #6b7280; layer = 10; active = 0 < len1 }
draw Text { name = "d1"; pos = (dx(1), 1.2); text = dig(1); size = 2.4; layer = 10; active = 1 < len1 }
draw Text { name = "w1"; pos = (dx(1), 0.1); text = wt(1); size = 1.2; layer = 10; active = 1 < len1 }
draw Text { name = "p1"; pos = (dx(1), -0.6); text = "10" + sup(1); size = 0.9; color = #6b7280; layer = 10; active = 1 < len1 }
draw Text { name = "d2"; pos = (dx(2), 1.2); text = dig(2); size = 2.4; layer = 10; active = 2 < len1 }
draw Text { name = "w2"; pos = (dx(2), 0.1); text = wt(2); size = 1.2; layer = 10; active = 2 < len1 }
draw Text { name = "p2"; pos = (dx(2), -0.6); text = "10" + sup(2); size = 0.9; color = #6b7280; layer = 10; active = 2 < len1 }
draw Text { name = "d3"; pos = (dx(3), 1.2); text = dig(3); size = 2.4; layer = 10; active = 3 < len1 }
draw Text { name = "w3"; pos = (dx(3), 0.1); text = wt(3); size = 1.2; layer = 10; active = 3 < len1 }
draw Text { name = "p3"; pos = (dx(3), -0.6); text = "10" + sup(3); size = 0.9; color = #6b7280; layer = 10; active = 3 < len1 }
draw Text { name = "d4"; pos = (dx(4), 1.2); text = dig(4); size = 2.4; layer = 10; active = 4 < len1 }
draw Text { name = "w4"; pos = (dx(4), 0.1); text = wt(4); size = 1.2; layer = 10; active = 4 < len1 }
draw Text { name = "p4"; pos = (dx(4), -0.6); text = "10" + sup(4); size = 0.9; color = #6b7280; layer = 10; active = 4 < len1 }
draw Text { name = "d5"; pos = (dx(5), 1.2); text = dig(5); size = 2.4; layer = 10; active = 5 < len1 }
draw Text { name = "w5"; pos = (dx(5), 0.1); text = wt(5); size = 1.2; layer = 10; active = 5 < len1 }
draw Text { name = "p5"; pos = (dx(5), -0.6); text = "10" + sup(5); size = 0.9; color = #6b7280; layer = 10; active = 5 < len1 }
draw Text { name = "d6"; pos = (dx(6), 1.2); text = dig(6); size = 2.4; layer = 10; active = 6 < len1 }
draw Text { name = "w6"; pos = (dx(6), 0.1); text = wt(6); size = 1.2; layer = 10; active = 6 < len1 }
draw Text { name = "p6"; pos = (dx(6), -0.6); text = "10" + sup(6); size = 0.9; color = #6b7280; layer = 10; active = 6 < len1 }
draw Text { name = "d7"; pos = (dx(7), 1.2); text = dig(7); size = 2.4; layer = 10; active = 7 < len1 }
draw Text { name = "w7"; pos = (dx(7), 0.1); text = wt(7); size = 1.2; layer = 10; active = 7 < len1 }
draw Text { name = "p7"; pos = (dx(7), -0.6); text = "10" + sup(7); size = 0.9; color = #6b7280; layer = 10; active = 7 < len1 }
draw Text { name = "tN"; pos = (0, 3.9); text = "N = " + ntext; size = 1.5 }
draw Text { name = "tS"; pos = (0, -2.2); text = sumText; size = 1.2 }
draw Text { name = "tR"; pos = (0, -3.4); text = resText; size = 1.2; color = resCol }

new UI { name = "bR"; type = button; label = "Случайное число"; action = "cmd = 1" }
new UI { name = "b11"; type = button; label = "Случайное кратное 11"; action = "cmd = 2" }

// ---- Логика ----
list D = (4, 3, 3, 6, 1, 7, 2, 0);
float len1 = 7;
float cmd = 0; float clicks = 0;
float N = 0;
string ntext = ""; string sumText = ""; string resText = ""; string resCol = "#22c55e";
string info = "";

Function md(a, b) { return a - floor(a / b) * b; }
// k — номер позиции справа (0 — единицы); на экране позиции идут справа налево
Function dx(k) { return (len1 - 1) / 2 * 1.5 - 1.5 * k; }
Function dig(k) { return format(D[k], 0); }
Function wt(k) { if (md(k, 2) == 0) { return "+1"; } return "−1"; }
Function sup(k) { if (k == 0) { return "⁰"; } if (k == 1) { return "¹"; } if (k == 2) { return "²"; } if (k == 3) { return "³"; } if (k == 4) { return "⁴"; } if (k == 5) { return "⁵"; } if (k == 6) { return "⁶"; } return "⁷"; }

Update {
  if (cmd == 1) { len1 = 3 + floor(random() * 6); repeat (8) { D[i] = floor(random() * 10); } if (D[len1 - 1] == 0) { D[len1 - 1] = 1; } }
  if (cmd == 2) { float v = 11 * (10 + floor(random() * 9000000)); len1 = 0; repeat (8) { D[i] = md(v, 10); v = floor(v / 10); if (D[i] > 0 || v > 0) { len1 = i + 1; } } }
  cmd = 0;
  if (mouseClickCount != clicks) {
    clicks = mouseClickCount;
    repeat (len1) { if (abs(mouseClickX - dx(i)) < 0.65 && abs(mouseClickY - 1.2) < 0.8) { D[i] = md(D[i] + 1, 10); } }
  }
  gp = newGraph(); gm = newGraph();
  N = 0; float alt = 0; ntext = ""; sumText = "";
  repeat (len1) { float k = len1 - 1 - i;
    N = N * 10 + D[k]; ntext = ntext + format(D[k], 0);
    if (md(k, 2) == 0) { addNode(gp, "k" + format(k, 0), [dx(k), 1.2]); alt = alt + D[k]; } else { addNode(gm, "k" + format(k, 0), [dx(k), 1.2]); alt = alt - D[k]; }
  }
  // запись знакочередующейся суммы справа налево: d₀ − d₁ + d₂ − …
  repeat (len1) { if (i == 0) { sumText = format(D[0], 0); } else { if (md(i, 2) == 0) { sumText = sumText + " + " + format(D[i], 0); } else { sumText = sumText + " − " + format(D[i], 0); } } }
  if (alt < 0) { sumText = sumText + " = −" + format(-alt, 0); } else { sumText = sumText + " = " + format(alt, 0); }
  if (md(alt, 11) == 0) { resText = "делится на 11  ⇒  N делится на 11:  N = 11 · " + format(N / 11, 0); resCol = "#22c55e"; }
  else { resText = "остаток " + format(md(alt, 11), 0) + " при делении на 11  —  и у N тот же остаток: N mod 11 = " + format(md(N, 11), 0); resCol = "#f59e0b"; }

  info = "**Признак делимости на 11:** число делится на 11 тогда и только тогда, когда знакочередующаяся сумма его цифр d₀ − d₁ + d₂ − … (справа налево, начиная с единиц со знаком «+») делится на 11.\n\n**Почему:** N = d₀ + d₁·10 + d₂·10² + … , а 10 ≡ −1 (mod 11), поэтому 10ᵏ ≡ (−1)ᵏ: +1 на чётных позициях и −1 на нечётных (цифры под числом). Значит, N ≡ d₀ − d₁ + d₂ − … (mod 11) — у числа и у знакочередующейся суммы **одинаковые остатки**, а не только одновременная делимость. Так же устроены и другие признаки: 10 ≡ 1 (mod 9) даёт признак делимости на 9 по сумме цифр.\n\nКлик по цифре увеличивает её на 1.";
}
]
