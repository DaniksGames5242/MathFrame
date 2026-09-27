[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Таблица Кэли: на пересечении строки a и столбца b — a ∗ b. Зелёные кружки — клетки, где
// получается нейтральный элемент e (в каждой строке группы такая клетка ровно одна — обратный
// элемент); красные — строка элемента без обратного. Справа — проверка аксиом. ----
draw Graph { name = "gE"; graph = "ge"; nodeColor = #22c55e; nodeRadius = 15; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gR"; graph = "gr"; nodeColor = #ef4444; nodeRadius = 15; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gOk"; graph = "gok"; nodeColor = #22c55e; nodeRadius = 11; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gNo"; graph = "gno"; nodeColor = #ef4444; nodeRadius = 11; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "hr0"; pos = (cx(-1), cy(0)); text = lab(0); size = 1.1; color = #f59e0b; active = 0 < m }
draw Text { name = "hc0"; pos = (cx(0), cy(-1)); text = lab(0); size = 1.1; color = #f59e0b; active = 0 < m }
draw Text { name = "c0_0"; pos = (cx(0), cy(0)); text = cell(0, 0); size = 1.1; layer = 20; active = 0 < m && 0 < m }
draw Text { name = "c0_1"; pos = (cx(1), cy(0)); text = cell(0, 1); size = 1.1; layer = 20; active = 0 < m && 1 < m }
draw Text { name = "c0_2"; pos = (cx(2), cy(0)); text = cell(0, 2); size = 1.1; layer = 20; active = 0 < m && 2 < m }
draw Text { name = "c0_3"; pos = (cx(3), cy(0)); text = cell(0, 3); size = 1.1; layer = 20; active = 0 < m && 3 < m }
draw Text { name = "c0_4"; pos = (cx(4), cy(0)); text = cell(0, 4); size = 1.1; layer = 20; active = 0 < m && 4 < m }
draw Text { name = "c0_5"; pos = (cx(5), cy(0)); text = cell(0, 5); size = 1.1; layer = 20; active = 0 < m && 5 < m }
draw Text { name = "c0_6"; pos = (cx(6), cy(0)); text = cell(0, 6); size = 1.1; layer = 20; active = 0 < m && 6 < m }
draw Text { name = "c0_7"; pos = (cx(7), cy(0)); text = cell(0, 7); size = 1.1; layer = 20; active = 0 < m && 7 < m }
draw Text { name = "hr1"; pos = (cx(-1), cy(1)); text = lab(1); size = 1.1; color = #f59e0b; active = 1 < m }
draw Text { name = "hc1"; pos = (cx(1), cy(-1)); text = lab(1); size = 1.1; color = #f59e0b; active = 1 < m }
draw Text { name = "c1_0"; pos = (cx(0), cy(1)); text = cell(1, 0); size = 1.1; layer = 20; active = 1 < m && 0 < m }
draw Text { name = "c1_1"; pos = (cx(1), cy(1)); text = cell(1, 1); size = 1.1; layer = 20; active = 1 < m && 1 < m }
draw Text { name = "c1_2"; pos = (cx(2), cy(1)); text = cell(1, 2); size = 1.1; layer = 20; active = 1 < m && 2 < m }
draw Text { name = "c1_3"; pos = (cx(3), cy(1)); text = cell(1, 3); size = 1.1; layer = 20; active = 1 < m && 3 < m }
draw Text { name = "c1_4"; pos = (cx(4), cy(1)); text = cell(1, 4); size = 1.1; layer = 20; active = 1 < m && 4 < m }
draw Text { name = "c1_5"; pos = (cx(5), cy(1)); text = cell(1, 5); size = 1.1; layer = 20; active = 1 < m && 5 < m }
draw Text { name = "c1_6"; pos = (cx(6), cy(1)); text = cell(1, 6); size = 1.1; layer = 20; active = 1 < m && 6 < m }
draw Text { name = "c1_7"; pos = (cx(7), cy(1)); text = cell(1, 7); size = 1.1; layer = 20; active = 1 < m && 7 < m }
draw Text { name = "hr2"; pos = (cx(-1), cy(2)); text = lab(2); size = 1.1; color = #f59e0b; active = 2 < m }
draw Text { name = "hc2"; pos = (cx(2), cy(-1)); text = lab(2); size = 1.1; color = #f59e0b; active = 2 < m }
draw Text { name = "c2_0"; pos = (cx(0), cy(2)); text = cell(2, 0); size = 1.1; layer = 20; active = 2 < m && 0 < m }
draw Text { name = "c2_1"; pos = (cx(1), cy(2)); text = cell(2, 1); size = 1.1; layer = 20; active = 2 < m && 1 < m }
draw Text { name = "c2_2"; pos = (cx(2), cy(2)); text = cell(2, 2); size = 1.1; layer = 20; active = 2 < m && 2 < m }
draw Text { name = "c2_3"; pos = (cx(3), cy(2)); text = cell(2, 3); size = 1.1; layer = 20; active = 2 < m && 3 < m }
draw Text { name = "c2_4"; pos = (cx(4), cy(2)); text = cell(2, 4); size = 1.1; layer = 20; active = 2 < m && 4 < m }
draw Text { name = "c2_5"; pos = (cx(5), cy(2)); text = cell(2, 5); size = 1.1; layer = 20; active = 2 < m && 5 < m }
draw Text { name = "c2_6"; pos = (cx(6), cy(2)); text = cell(2, 6); size = 1.1; layer = 20; active = 2 < m && 6 < m }
draw Text { name = "c2_7"; pos = (cx(7), cy(2)); text = cell(2, 7); size = 1.1; layer = 20; active = 2 < m && 7 < m }
draw Text { name = "hr3"; pos = (cx(-1), cy(3)); text = lab(3); size = 1.1; color = #f59e0b; active = 3 < m }
draw Text { name = "hc3"; pos = (cx(3), cy(-1)); text = lab(3); size = 1.1; color = #f59e0b; active = 3 < m }
draw Text { name = "c3_0"; pos = (cx(0), cy(3)); text = cell(3, 0); size = 1.1; layer = 20; active = 3 < m && 0 < m }
draw Text { name = "c3_1"; pos = (cx(1), cy(3)); text = cell(3, 1); size = 1.1; layer = 20; active = 3 < m && 1 < m }
draw Text { name = "c3_2"; pos = (cx(2), cy(3)); text = cell(3, 2); size = 1.1; layer = 20; active = 3 < m && 2 < m }
draw Text { name = "c3_3"; pos = (cx(3), cy(3)); text = cell(3, 3); size = 1.1; layer = 20; active = 3 < m && 3 < m }
draw Text { name = "c3_4"; pos = (cx(4), cy(3)); text = cell(3, 4); size = 1.1; layer = 20; active = 3 < m && 4 < m }
draw Text { name = "c3_5"; pos = (cx(5), cy(3)); text = cell(3, 5); size = 1.1; layer = 20; active = 3 < m && 5 < m }
draw Text { name = "c3_6"; pos = (cx(6), cy(3)); text = cell(3, 6); size = 1.1; layer = 20; active = 3 < m && 6 < m }
draw Text { name = "c3_7"; pos = (cx(7), cy(3)); text = cell(3, 7); size = 1.1; layer = 20; active = 3 < m && 7 < m }
draw Text { name = "hr4"; pos = (cx(-1), cy(4)); text = lab(4); size = 1.1; color = #f59e0b; active = 4 < m }
draw Text { name = "hc4"; pos = (cx(4), cy(-1)); text = lab(4); size = 1.1; color = #f59e0b; active = 4 < m }
draw Text { name = "c4_0"; pos = (cx(0), cy(4)); text = cell(4, 0); size = 1.1; layer = 20; active = 4 < m && 0 < m }
draw Text { name = "c4_1"; pos = (cx(1), cy(4)); text = cell(4, 1); size = 1.1; layer = 20; active = 4 < m && 1 < m }
draw Text { name = "c4_2"; pos = (cx(2), cy(4)); text = cell(4, 2); size = 1.1; layer = 20; active = 4 < m && 2 < m }
draw Text { name = "c4_3"; pos = (cx(3), cy(4)); text = cell(4, 3); size = 1.1; layer = 20; active = 4 < m && 3 < m }
draw Text { name = "c4_4"; pos = (cx(4), cy(4)); text = cell(4, 4); size = 1.1; layer = 20; active = 4 < m && 4 < m }
draw Text { name = "c4_5"; pos = (cx(5), cy(4)); text = cell(4, 5); size = 1.1; layer = 20; active = 4 < m && 5 < m }
draw Text { name = "c4_6"; pos = (cx(6), cy(4)); text = cell(4, 6); size = 1.1; layer = 20; active = 4 < m && 6 < m }
draw Text { name = "c4_7"; pos = (cx(7), cy(4)); text = cell(4, 7); size = 1.1; layer = 20; active = 4 < m && 7 < m }
draw Text { name = "hr5"; pos = (cx(-1), cy(5)); text = lab(5); size = 1.1; color = #f59e0b; active = 5 < m }
draw Text { name = "hc5"; pos = (cx(5), cy(-1)); text = lab(5); size = 1.1; color = #f59e0b; active = 5 < m }
draw Text { name = "c5_0"; pos = (cx(0), cy(5)); text = cell(5, 0); size = 1.1; layer = 20; active = 5 < m && 0 < m }
draw Text { name = "c5_1"; pos = (cx(1), cy(5)); text = cell(5, 1); size = 1.1; layer = 20; active = 5 < m && 1 < m }
draw Text { name = "c5_2"; pos = (cx(2), cy(5)); text = cell(5, 2); size = 1.1; layer = 20; active = 5 < m && 2 < m }
draw Text { name = "c5_3"; pos = (cx(3), cy(5)); text = cell(5, 3); size = 1.1; layer = 20; active = 5 < m && 3 < m }
draw Text { name = "c5_4"; pos = (cx(4), cy(5)); text = cell(5, 4); size = 1.1; layer = 20; active = 5 < m && 4 < m }
draw Text { name = "c5_5"; pos = (cx(5), cy(5)); text = cell(5, 5); size = 1.1; layer = 20; active = 5 < m && 5 < m }
draw Text { name = "c5_6"; pos = (cx(6), cy(5)); text = cell(5, 6); size = 1.1; layer = 20; active = 5 < m && 6 < m }
draw Text { name = "c5_7"; pos = (cx(7), cy(5)); text = cell(5, 7); size = 1.1; layer = 20; active = 5 < m && 7 < m }
draw Text { name = "hr6"; pos = (cx(-1), cy(6)); text = lab(6); size = 1.1; color = #f59e0b; active = 6 < m }
draw Text { name = "hc6"; pos = (cx(6), cy(-1)); text = lab(6); size = 1.1; color = #f59e0b; active = 6 < m }
draw Text { name = "c6_0"; pos = (cx(0), cy(6)); text = cell(6, 0); size = 1.1; layer = 20; active = 6 < m && 0 < m }
draw Text { name = "c6_1"; pos = (cx(1), cy(6)); text = cell(6, 1); size = 1.1; layer = 20; active = 6 < m && 1 < m }
draw Text { name = "c6_2"; pos = (cx(2), cy(6)); text = cell(6, 2); size = 1.1; layer = 20; active = 6 < m && 2 < m }
draw Text { name = "c6_3"; pos = (cx(3), cy(6)); text = cell(6, 3); size = 1.1; layer = 20; active = 6 < m && 3 < m }
draw Text { name = "c6_4"; pos = (cx(4), cy(6)); text = cell(6, 4); size = 1.1; layer = 20; active = 6 < m && 4 < m }
draw Text { name = "c6_5"; pos = (cx(5), cy(6)); text = cell(6, 5); size = 1.1; layer = 20; active = 6 < m && 5 < m }
draw Text { name = "c6_6"; pos = (cx(6), cy(6)); text = cell(6, 6); size = 1.1; layer = 20; active = 6 < m && 6 < m }
draw Text { name = "c6_7"; pos = (cx(7), cy(6)); text = cell(6, 7); size = 1.1; layer = 20; active = 6 < m && 7 < m }
draw Text { name = "hr7"; pos = (cx(-1), cy(7)); text = lab(7); size = 1.1; color = #f59e0b; active = 7 < m }
draw Text { name = "hc7"; pos = (cx(7), cy(-1)); text = lab(7); size = 1.1; color = #f59e0b; active = 7 < m }
draw Text { name = "c7_0"; pos = (cx(0), cy(7)); text = cell(7, 0); size = 1.1; layer = 20; active = 7 < m && 0 < m }
draw Text { name = "c7_1"; pos = (cx(1), cy(7)); text = cell(7, 1); size = 1.1; layer = 20; active = 7 < m && 1 < m }
draw Text { name = "c7_2"; pos = (cx(2), cy(7)); text = cell(7, 2); size = 1.1; layer = 20; active = 7 < m && 2 < m }
draw Text { name = "c7_3"; pos = (cx(3), cy(7)); text = cell(7, 3); size = 1.1; layer = 20; active = 7 < m && 3 < m }
draw Text { name = "c7_4"; pos = (cx(4), cy(7)); text = cell(7, 4); size = 1.1; layer = 20; active = 7 < m && 4 < m }
draw Text { name = "c7_5"; pos = (cx(5), cy(7)); text = cell(7, 5); size = 1.1; layer = 20; active = 7 < m && 5 < m }
draw Text { name = "c7_6"; pos = (cx(6), cy(7)); text = cell(7, 6); size = 1.1; layer = 20; active = 7 < m && 6 < m }
draw Text { name = "c7_7"; pos = (cx(7), cy(7)); text = cell(7, 7); size = 1.1; layer = 20; active = 7 < m && 7 < m }
draw Text { name = "op"; pos = (cx(-1), cy(-1)); text = "∗"; size = 1.3; color = #f59e0b }
draw Text { name = "ax0"; pos = (3.4, 3.2); text = "замкнутость"; size = 1; align = left }
draw Text { name = "aw0"; pos = (3.4, 2.75); text = wit(0); size = 0.85; color = #6b7280; align = left }
draw Text { name = "ax1"; pos = (3.4, 2.1); text = "ассоциативность"; size = 1; align = left }
draw Text { name = "aw1"; pos = (3.4, 1.65); text = wit(1); size = 0.85; color = #6b7280; align = left }
draw Text { name = "ax2"; pos = (3.4, 1); text = "нейтральный элемент"; size = 1; align = left }
draw Text { name = "aw2"; pos = (3.4, 0.55); text = wit(2); size = 0.85; color = #6b7280; align = left }
draw Text { name = "ax3"; pos = (3.4, -0.1); text = "обратные элементы"; size = 1; align = left }
draw Text { name = "aw3"; pos = (3.4, -0.55); text = wit(3); size = 0.85; color = #6b7280; align = left }

new UI { name = "sO"; type = select; label = "операция"; variable = op; options = ("add", "sub", "mul0", "mul1", "max"); labels = ("a + b mod n на {0…n−1}", "a − b mod n", "a · b mod n на {0…n−1}", "a · b mod n на {1…n−1}", "max(a, b)"); default = "mul1" }
new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 2; max = 8; step = 1; default = 7 }

// ---- Логика ----
string op = "mul1"; float n = 7;
float m = 7;
float cs = 0.9;
float e = -1;
list okA = (1, 1, 1, 1);
string w0 = ""; string w1 = ""; string w2 = ""; string w3 = "";
string info = "";

Function md(a, b) { return a - floor(a / b) * b; }
Function el(i) { if (op == "mul1") { return i + 1; } return i; }
Function f(a, b) {
  if (op == "add") { return md(a + b, n); }
  if (op == "sub") { return md(a - b, n); }
  if (op == "mul0" || op == "mul1") { return md(a * b, n); }
  return max(a, b);
}
Function inSet(v) { if (op == "mul1") { return v >= 1 && v < n; } return v >= 0 && v < n; }
Function lab(i) { return format(el(i), 0); }
Function cell(i, j) { return format(f(el(i), el(j)), 0); }
Function cx(j) { return -6.2 + cs * (j + 1.5); }
Function cy(i) { return 3.4 - cs * (i + 1); }
Function wit(k) { if (k == 0) { return w0; } if (k == 1) { return w1; } if (k == 2) { return w2; } return w3; }

Update {
  m = n; if (op == "mul1") { m = n - 1; }
  cs = min(0.95, 8.4 / (m + 1.5));
  repeat (4) { okA[i] = 1; }
  w0 = ""; w1 = ""; w2 = ""; w3 = "";
  // замкнутость
  repeat (m) { float a = el(i); repeat (m) { float b = el(i); if (!inSet(f(a, b)) && okA[0] == 1) { okA[0] = 0; w0 = format(a, 0) + " ∗ " + format(b, 0) + " = " + format(f(a, b), 0) + " — не из множества"; } } }
  // ассоциативность: ищем первую тройку с (a∗b)∗c ≠ a∗(b∗c)
  repeat (m) { float a = el(i); repeat (m) { float b = el(i); repeat (m) { float c = el(i);
    if (okA[1] == 1 && f(f(a, b), c) != f(a, f(b, c))) { okA[1] = 0; w1 = "(" + format(a, 0) + "∗" + format(b, 0) + ")∗" + format(c, 0) + " = " + format(f(f(a, b), c), 0) + ", а " + format(a, 0) + "∗(" + format(b, 0) + "∗" + format(c, 0) + ") = " + format(f(a, f(b, c)), 0); }
  } } }
  // нейтральный: e ∗ x = x ∗ e = x для всех x
  e = -1;
  repeat (m) { float c = el(i); float good = 1; repeat (m) { float x = el(i); if (f(c, x) != x || f(x, c) != x) { good = 0; } } if (good == 1 && e < 0) { e = c; } }
  if (e < 0) { okA[2] = 0; w2 = "нет элемента e с e ∗ x = x ∗ e = x"; } else { w2 = "e = " + format(e, 0); }
  // обратные
  ge = newGraph(); gr = newGraph();
  if (e >= 0) {
    repeat (m) { float ii = i; float a = el(ii); float has = 0;
      repeat (m) { float b = el(i); if (f(a, b) == e && f(b, a) == e) { has = 1; } if (f(a, b) == e) { addNode(ge, format(ii, 0) + "_" + format(i, 0), [cx(i), cy(ii)]); } }
      if (has == 0) { if (okA[3] == 1) { w3 = "у " + format(a, 0) + " нет обратного"; } okA[3] = 0; repeat (m) { addNode(gr, "r" + format(ii, 0) + "_" + format(i, 0), [cx(i), cy(ii)]); } }
    }
  } else { okA[3] = 0; w3 = "без e обратные не определены"; }
  gok = newGraph(); gno = newGraph();
  repeat (4) { if (okA[i] == 1) { addNode(gok, "k" + format(i, 0), [3.0, 3.2 - 1.1 * i]); } else { addNode(gno, "k" + format(i, 0), [3.0, 3.2 - 1.1 * i]); } }
  float grp = okA[0] * okA[1] * okA[2] * okA[3];

  info = "**Аксиомы группы:** множество G с операцией ∗ — группа, если (1) операция не выводит из G; (2) ассоциативна: (a∗b)∗c = a∗(b∗c); (3) есть нейтральный элемент e: e∗a = a∗e = a; (4) у каждого a есть обратный a⁻¹: a∗a⁻¹ = a⁻¹∗a = e. Коммутативность не требуется.\n\n";
  if (grp == 1) { info = info + "**Это группа** порядка " + format(m, 0) + ". В таблице Кэли группы каждый элемент встречается в каждой строке и каждом столбце ровно один раз (латинский квадрат)."; }
  else { info = info + "**Не группа.** Нарушено: "; string s = ""; if (okA[0] == 0) { s = s + "замкнутость; "; } if (okA[1] == 0) { s = s + "ассоциативность; "; } if (okA[2] == 0) { s = s + "нет нейтрального; "; } if (okA[3] == 0) { s = s + "не у всех есть обратный; "; } info = info + s; }
  if (op == "mul1" && grp == 0) { info = info + " Умножение ненулевых остатков образует группу только при простом n."; }
}
]
