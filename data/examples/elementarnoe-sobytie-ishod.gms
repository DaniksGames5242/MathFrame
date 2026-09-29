[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Эксперимент: m подбрасываний монеты (О — орёл, Р — решка). Что считать элементарным исходом,
// решает постановка: упорядоченный набор результатов (2ᵐ равновозможных исходов) или только число
// орлов (m + 1 исходов, уже не равновозможных). Высота столбика — вероятность исхода; клик выбирает исход. ----
draw Graph { name = "gB"; graph = "gb"; edgeColor = #3b82f6; edgeWidth = 30; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gS"; graph = "gs"; edgeColor = #f59e0b; edgeWidth = 30; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gL"; graph = "gl"; nodeRadius = 20; nodeColor = #3b82f633; labels = true; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "tY"; pos = (-7.7, 4.4); text = "P(ω)"; size = 0.9; align = left }

new UI { name = "sM"; type = select; label = "элементарный исход —"; variable = md; options = ("pair", "cnt"); labels = ("набор результатов", "число орлов"); default = "pair" }
new UI { name = "sN"; type = slider; label = "подбрасываний m"; variable = m; min = 1; max = 4; step = 1; default = 3 }

// ---- Логика ----
string md = "pair"; float m = 3; float sel = 2; float clicks = 0; float key = -1;
string info = "";

Function md2(a, b) { return a - floor(a / b) * b; }
Function bit(w, j) { return md2(floor(w / pow(2, j)), 2); }
Function pc(w) { float c = 0; repeat (m) { c = c + bit(w, i); } return c; }
Function word(w) { string s = ""; repeat (m) { if (bit(w, m - 1 - i) == 1) { s = s + "О"; } else { s = s + "Р"; } } return s; }
Function binom(k) { float c = 0; repeat (pow(2, m)) { if (pc(i) == k) { c = c + 1; } } return c; }
Function cntOf() { if (md == "pair") { return pow(2, m); } return m + 1; }
Function fx(j) { float c = cntOf(); if (c == 1) { return 0; } return -7 + 14 * j / (c - 1); }

Update {
  float c = cntOf();
  if (mouseClickCount != clicks) {
    clicks = mouseClickCount;
    float q = 0; float best = 1000;
    repeat (c) { if (abs(mouseClickX - fx(i)) < best) { best = abs(mouseClickX - fx(i)); q = i; } }
    if (best < 0.9) { sel = q; }
  }
  if (sel >= c) { sel = c - 1; }
  float kk = m * 1000 + sel * 10; if (md == "cnt") { kk = kk + 1; }
  if (key != kk) {
    key = kk; gb = newGraph(); gs = newGraph(); gl = newGraph();
    repeat (c) {
      float p = 1 / c; string lb = word(i);
      if (md == "cnt") { p = binom(i) / pow(2, m); lb = format(i, 0); }
      if (i == sel) { addNode(gs, "u" + format(i, 0), [fx(i), -2.6]); addNode(gs, "v" + format(i, 0), [fx(i), -2.6 + 14 * p]); addEdge(gs, "u" + format(i, 0), "v" + format(i, 0)); }
      else { addNode(gb, "u" + format(i, 0), [fx(i), -2.6]); addNode(gb, "v" + format(i, 0), [fx(i), -2.6 + 14 * p]); addEdge(gb, "u" + format(i, 0), "v" + format(i, 0)); }
      addNode(gl, "l" + format(i, 0), [fx(i), -3.8], lb);
    }
  }
  float tn = pow(2, m);
  info = "**Элементарный исход** — неделимый результат эксперимента: " + format(m, 0) + " подбрасываний монеты, О — орёл, Р — решка. Что считать элементарным, определяется постановкой, а не физикой монеты.\n\n";
  if (md == "pair") {
    info = info + "**Исход — упорядоченный набор:** " + format(tn, 0) + " исходов, попарно несовместны (реализуется ровно один), вместе образуют пространство Ω; все равновозможны, P = 1/" + format(tn, 0) + ". Выбран исход «" + word(sel) + "» — он неделим.";
  } else {
    string parts = ""; repeat (tn) { if (pc(i) == sel) { parts = parts + word(i) + " "; } }
    info = info + "**Исход — число орлов:** " + format(m + 1, 0) + " исходов 0, …, " + format(m, 0) + " с вероятностями C(" + format(m, 0) + ", k)/" + format(tn, 0) + " — уже **не равновозможные**. Выбран исход «" + format(sel, 0) + " орл.»: P = " + format(binom(sel), 0) + "/" + format(tn, 0) + "; в терминах наборов это объединение " + format(binom(sel), 0) + " исходов: " + parts + "— то есть он получен склейкой элементарных исходов первой постановки.";
  }
  info = info + "\n\nЛюбое событие — подмножество Ω, а элементарный исход — одноточечное подмножество {ω}.";
}
]
