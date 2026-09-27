[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Отображение f: A → P(A), A = {1, …, n}. Строка x таблицы — подмножество f(x):
// закрашенная клетка в столбце y означает y ∈ f(x). Клик по клетке меняет её.
// Оранжевые кольца — диагональ (x ∈ f(x)?); нижняя строка — диагональное множество
// D = {x : x ∉ f(x)}: диагональ, взятая наоборот. ----
draw Graph { name = "gDiag"; graph = "gd"; nodeColor = #f59e0b; nodeRadius = 21; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gOff"; graph = "g0"; nodeColor = #6b7280; nodeRadius = 16; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gOn"; graph = "g1"; nodeColor = #3b82f6; nodeRadius = 16; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gDOn"; graph = "h1"; nodeColor = #22c55e; nodeRadius = 16; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gMis"; graph = "gx"; nodeColor = #ef4444; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 12 }
draw Text { name = "rl0"; pos = (cx(-1) - 0.3, cy(0)); text = "f(1)"; size = 1.1; active = 0 < n }
draw Text { name = "cl0"; pos = (cx(0), cy(-1)); text = "1"; size = 1.1; color = #6b7280; active = 0 < n }
draw Text { name = "rs0"; pos = (cx(n) + 1.9, cy(0)); text = rowNote(0); size = 0.95; color = #ef4444; active = 0 < n }
draw Text { name = "rl1"; pos = (cx(-1) - 0.3, cy(1)); text = "f(2)"; size = 1.1; active = 1 < n }
draw Text { name = "cl1"; pos = (cx(1), cy(-1)); text = "2"; size = 1.1; color = #6b7280; active = 1 < n }
draw Text { name = "rs1"; pos = (cx(n) + 1.9, cy(1)); text = rowNote(1); size = 0.95; color = #ef4444; active = 1 < n }
draw Text { name = "rl2"; pos = (cx(-1) - 0.3, cy(2)); text = "f(3)"; size = 1.1; active = 2 < n }
draw Text { name = "cl2"; pos = (cx(2), cy(-1)); text = "3"; size = 1.1; color = #6b7280; active = 2 < n }
draw Text { name = "rs2"; pos = (cx(n) + 1.9, cy(2)); text = rowNote(2); size = 0.95; color = #ef4444; active = 2 < n }
draw Text { name = "rl3"; pos = (cx(-1) - 0.3, cy(3)); text = "f(4)"; size = 1.1; active = 3 < n }
draw Text { name = "cl3"; pos = (cx(3), cy(-1)); text = "4"; size = 1.1; color = #6b7280; active = 3 < n }
draw Text { name = "rs3"; pos = (cx(n) + 1.9, cy(3)); text = rowNote(3); size = 0.95; color = #ef4444; active = 3 < n }
draw Text { name = "rl4"; pos = (cx(-1) - 0.3, cy(4)); text = "f(5)"; size = 1.1; active = 4 < n }
draw Text { name = "cl4"; pos = (cx(4), cy(-1)); text = "5"; size = 1.1; color = #6b7280; active = 4 < n }
draw Text { name = "rs4"; pos = (cx(n) + 1.9, cy(4)); text = rowNote(4); size = 0.95; color = #ef4444; active = 4 < n }
draw Text { name = "rl5"; pos = (cx(-1) - 0.3, cy(5)); text = "f(6)"; size = 1.1; active = 5 < n }
draw Text { name = "cl5"; pos = (cx(5), cy(-1)); text = "6"; size = 1.1; color = #6b7280; active = 5 < n }
draw Text { name = "rs5"; pos = (cx(n) + 1.9, cy(5)); text = rowNote(5); size = 0.95; color = #ef4444; active = 5 < n }
draw Text { name = "dl"; pos = (cx(-1) - 0.3, cy(n) - 0.35); text = "D"; size = 1.2; color = #22c55e }

new UI { name = "sN"; type = select; label = "|A| = n"; variable = n; options = (3, 4, 5, 6); default = 5 }
new UI { name = "bR"; type = button; label = "Случайное f"; action = "mix = 1" }

// ---- Логика ----
float n = 5; float lastN = 0;
float mix = 0;
float clicks = 0;
float cs = 1;
list M = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
string dText = "";
string info = "";

Function cx(j) { return -cs * n / 2 + cs * (j + 0.5) - 1; }
Function cy(i) { return cs * (n + 1) / 2 + 0.2 - cs * (i + 0.5); }
// Строка x отличается от D как раз в столбце x: x ∈ f(x) ⇔ x ∉ D
Function rowNote(i) { if (M[i * 6 + i] == 1) { return "≠ D: " + format(i + 1, 0) + " ∈ f(" + format(i + 1, 0) + "), но ∉ D"; } return "≠ D: " + format(i + 1, 0) + " ∉ f(" + format(i + 1, 0) + "), но ∈ D"; }

Update {
  cs = min(1.25, 7.6 / (n + 1.6));
  if (n != lastN) {
    // стартовое f — «почти хорошее»: f(x) = {x, x+1}
    repeat (36) { M[i] = 0; }
    repeat (n) { M[i * 6 + i] = 1; if (i + 1 < n) { M[i * 6 + i + 1] = 1; } }
    lastN = n;
  }
  if (mix == 1) { repeat (36) { M[i] = floor(random() * 2); } mix = 0; }
  if (mouseClickCount != clicks) {
    clicks = mouseClickCount;
    float j0 = floor((mouseClickX - cx(0) + cs / 2) / cs); float i0 = floor((cy(0) + cs / 2 - mouseClickY) / cs);
    if (i0 >= 0 && i0 < n && j0 >= 0 && j0 < n) { M[i0 * 6 + j0] = 1 - M[i0 * 6 + j0]; }
  }
  g0 = newGraph(); g1 = newGraph(); gd = newGraph(); h1 = newGraph(); gx = newGraph();
  dText = "";
  repeat (n) { float r = i; repeat (n) { float c = i;
    string k = format(r, 0) + "_" + format(c, 0);
    if (M[r * 6 + c] == 1) { addNode(g1, k, [cx(c), cy(r)]); } else { addNode(g0, k, [cx(c), cy(r)]); }
    if (r == c) { addNode(gd, k, [cx(c), cy(r)]); }
  } }
  // D: берём диагональ наоборот
  repeat (n) {
    string k = "d" + format(i, 0);
    if (M[i * 6 + i] == 0) { addNode(h1, k, [cx(i), cy(n) - 0.35]); if (dText != "") { dText = dText + ", "; } dText = dText + format(i + 1, 0); }
    else { addNode(g0, k, [cx(i), cy(n) - 0.35]); }
  }
  if (dText == "") { dText = "∅"; } else { dText = "{" + dText + "}"; }

  info = "**Теорема Кантора:** мощность множества всех подмножеств P(A) строго больше мощности A — для любого множества, конечного или бесконечного. Иначе говоря, никакое отображение f: A → P(A) не является сюръекцией.\n\n**Диагональное доказательство.** Составим множество D = {x ∈ A : x ∉ f(x)} — пройдём по диагонали таблицы и возьмём каждый ответ наоборот. Если бы D = f(y) для некоторого y, то y ∈ D ⇔ y ∉ f(y) = D — противоречие. Значит, D отличается от каждой строки — хотя бы в диагональной клетке.\n\nСейчас D = " + dText + ", и оно не совпадает ни с одной строкой. Попробуйте кликами сделать какую-нибудь строку x равной D: как только меняется клетка (x; x), меняется и само D.";
}
]
