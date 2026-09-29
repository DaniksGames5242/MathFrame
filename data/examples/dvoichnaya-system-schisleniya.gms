[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Восемь двоичных разрядов: клик по клетке переворачивает бит. Строки: вес 2ᵏ, бит, вклад,
// частное N ÷ 2ᵏ (целая часть) и остаток — то есть тот же бит, полученный делением на 2. ----
draw Graph { name = "gC"; graph = "gc"; edgeWidth = 58; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "lw"; pos = (-7.9, 4.1); text = "вес"; size = 0.85; align = left }
draw Text { name = "lb"; pos = (-7.9, 2.6); text = "бит"; size = 0.85; align = left }
draw Text { name = "lv"; pos = (-7.9, 1.1); text = "вклад"; size = 0.85; align = left }
draw Text { name = "lq"; pos = (-7.9, -1.0); text = "N ÷ 2ᵏ"; size = 0.85; align = left }
draw Text { name = "lr"; pos = (-7.9, -2.5); text = "остаток"; size = 0.85; align = left }
draw Text { name = "w0"; pos = (5.6, 4.1); text = format(pow(2, 0), 0); size = 1; layer = 6 }
draw Text { name = "b0"; pos = (5.6, 2.6); text = format(bit(0), 0); size = 1.9; layer = 6 }
draw Text { name = "v0"; pos = (5.6, 1.1); text = format(bit(0) * pow(2, 0), 0); size = 1; layer = 6; active = bit(0) > 0.5 }
draw Text { name = "q0"; pos = (5.6, -1.0); text = format(floor(N / pow(2, 0)), 0); size = 1.1; layer = 6 }
draw Text { name = "r0"; pos = (5.6, -2.5); text = format(bit(0), 0); size = 1.4; color = #22c55e; layer = 6 }
draw Text { name = "w1"; pos = (4.0, 4.1); text = format(pow(2, 1), 0); size = 1; layer = 6 }
draw Text { name = "b1"; pos = (4.0, 2.6); text = format(bit(1), 0); size = 1.9; layer = 6 }
draw Text { name = "v1"; pos = (4.0, 1.1); text = format(bit(1) * pow(2, 1), 0); size = 1; layer = 6; active = bit(1) > 0.5 }
draw Text { name = "q1"; pos = (4.0, -1.0); text = format(floor(N / pow(2, 1)), 0); size = 1.1; layer = 6 }
draw Text { name = "r1"; pos = (4.0, -2.5); text = format(bit(1), 0); size = 1.4; color = #22c55e; layer = 6 }
draw Text { name = "w2"; pos = (2.4, 4.1); text = format(pow(2, 2), 0); size = 1; layer = 6 }
draw Text { name = "b2"; pos = (2.4, 2.6); text = format(bit(2), 0); size = 1.9; layer = 6 }
draw Text { name = "v2"; pos = (2.4, 1.1); text = format(bit(2) * pow(2, 2), 0); size = 1; layer = 6; active = bit(2) > 0.5 }
draw Text { name = "q2"; pos = (2.4, -1.0); text = format(floor(N / pow(2, 2)), 0); size = 1.1; layer = 6 }
draw Text { name = "r2"; pos = (2.4, -2.5); text = format(bit(2), 0); size = 1.4; color = #22c55e; layer = 6 }
draw Text { name = "w3"; pos = (0.8, 4.1); text = format(pow(2, 3), 0); size = 1; layer = 6 }
draw Text { name = "b3"; pos = (0.8, 2.6); text = format(bit(3), 0); size = 1.9; layer = 6 }
draw Text { name = "v3"; pos = (0.8, 1.1); text = format(bit(3) * pow(2, 3), 0); size = 1; layer = 6; active = bit(3) > 0.5 }
draw Text { name = "q3"; pos = (0.8, -1.0); text = format(floor(N / pow(2, 3)), 0); size = 1.1; layer = 6 }
draw Text { name = "r3"; pos = (0.8, -2.5); text = format(bit(3), 0); size = 1.4; color = #22c55e; layer = 6 }
draw Text { name = "w4"; pos = (-0.8, 4.1); text = format(pow(2, 4), 0); size = 1; layer = 6 }
draw Text { name = "b4"; pos = (-0.8, 2.6); text = format(bit(4), 0); size = 1.9; layer = 6 }
draw Text { name = "v4"; pos = (-0.8, 1.1); text = format(bit(4) * pow(2, 4), 0); size = 1; layer = 6; active = bit(4) > 0.5 }
draw Text { name = "q4"; pos = (-0.8, -1.0); text = format(floor(N / pow(2, 4)), 0); size = 1.1; layer = 6 }
draw Text { name = "r4"; pos = (-0.8, -2.5); text = format(bit(4), 0); size = 1.4; color = #22c55e; layer = 6 }
draw Text { name = "w5"; pos = (-2.4, 4.1); text = format(pow(2, 5), 0); size = 1; layer = 6 }
draw Text { name = "b5"; pos = (-2.4, 2.6); text = format(bit(5), 0); size = 1.9; layer = 6 }
draw Text { name = "v5"; pos = (-2.4, 1.1); text = format(bit(5) * pow(2, 5), 0); size = 1; layer = 6; active = bit(5) > 0.5 }
draw Text { name = "q5"; pos = (-2.4, -1.0); text = format(floor(N / pow(2, 5)), 0); size = 1.1; layer = 6 }
draw Text { name = "r5"; pos = (-2.4, -2.5); text = format(bit(5), 0); size = 1.4; color = #22c55e; layer = 6 }
draw Text { name = "w6"; pos = (-4.0, 4.1); text = format(pow(2, 6), 0); size = 1; layer = 6 }
draw Text { name = "b6"; pos = (-4.0, 2.6); text = format(bit(6), 0); size = 1.9; layer = 6 }
draw Text { name = "v6"; pos = (-4.0, 1.1); text = format(bit(6) * pow(2, 6), 0); size = 1; layer = 6; active = bit(6) > 0.5 }
draw Text { name = "q6"; pos = (-4.0, -1.0); text = format(floor(N / pow(2, 6)), 0); size = 1.1; layer = 6 }
draw Text { name = "r6"; pos = (-4.0, -2.5); text = format(bit(6), 0); size = 1.4; color = #22c55e; layer = 6 }
draw Text { name = "w7"; pos = (-5.6, 4.1); text = format(pow(2, 7), 0); size = 1; layer = 6 }
draw Text { name = "b7"; pos = (-5.6, 2.6); text = format(bit(7), 0); size = 1.9; layer = 6 }
draw Text { name = "v7"; pos = (-5.6, 1.1); text = format(bit(7) * pow(2, 7), 0); size = 1; layer = 6; active = bit(7) > 0.5 }
draw Text { name = "q7"; pos = (-5.6, -1.0); text = format(floor(N / pow(2, 7)), 0); size = 1.1; layer = 6 }
draw Text { name = "r7"; pos = (-5.6, -2.5); text = format(bit(7), 0); size = 1.4; color = #22c55e; layer = 6 }

new UI { name = "bm"; type = button; label = "−1"; action = "N = N - 1" }
new UI { name = "bp"; type = button; label = "+1"; action = "N = N + 1" }
new UI { name = "bd"; type = button; label = "×2"; action = "N = N * 2" }
new UI { name = "bh"; type = button; label = "÷2"; action = "N = floor(N / 2)" }

float N = 45; float key = -1; float clicks = 0; string info = "";

Function bit(k) { return floor(N / pow(2, k)) - 2 * floor(N / pow(2, k + 1)); }
Function cxk(k) { return 5.6 - 1.6 * k; }

Update {
  if (mouseClickCount != clicks) {
    clicks = mouseClickCount;
    if (abs(mouseClickY - 2.6) < 1.1) {
      repeat (8) { if (abs(mouseClickX - cxk(i)) < 0.8) { N = N + (1 - 2 * bit(i)) * pow(2, i); } }
    }
  }
  if (N > 255) { N = 255; }
  if (N < 0) { N = 0; }
  if (key != N) {
    key = N;
    gc = newGraph();
    repeat (8) {
      string c = "#3b82f633"; if (bit(i) > 0.5) { c = "#f59e0b66"; }
      addNode(gc, "a" + format(i, 0), [cxk(i) - 0.65, 2.6]); addNode(gc, "b" + format(i, 0), [cxk(i) + 0.65, 2.6]); addEdge(gc, "a" + format(i, 0), "b" + format(i, 0), 1, c);
    }
  }
  string rec = ""; string sum = ""; float ones = 0; float len = 0;
  repeat (8) { float k = 7 - i; if (bit(k) > 0.5 || len > 0) { rec = rec + format(bit(k), 0); len = len + 1; } if (bit(k) > 0.5) { if (ones > 0) { sum = sum + " + "; } sum = sum + format(pow(2, k), 0); ones = ones + 1; } }
  if (N == 0) { rec = "0"; sum = "0"; }
  info = "**Двоичная система:** цифры только 0 и 1, позиция k имеет вес 2ᵏ. Слагаемые берутся там, где стоит 1 (перевод в десятичную):\n\n**" + rec + " = " + sum + " = " + format(N, 0) + "**.\n\n";
  info = info + "Обратный перевод — деление на 2: остатки, прочитанные от младшего разряда к старшему, и есть двоичные цифры. Запись состоит из " + format(max(len, 1), 0) + " цифр (для N число цифр — округлённый вверх log₂(N + 1)).\n\n";
  if (bit(0) > 0.5) { info = info + "Младший разряд равен 1 — число нечётное."; } else { info = info + "Младший разряд равен 0 — число чётное."; }
  if (ones == 1) { info = info + " Единица одна — число является степенью двойки."; }
  info = info + " Клик по клетке бита переворачивает его.";
}
]
