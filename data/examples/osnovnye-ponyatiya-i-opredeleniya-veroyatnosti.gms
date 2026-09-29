[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Ω = {1, …, 6} (грани кости); высота столбика — вероятность исхода. Строки A и B под осью:
// событие — подмножество Ω, клик по клетке добавляет/убирает исход. Цвет столбика:
// только в A — синий, только в B — жёлтый, в обоих — зелёный. ----
draw Graph { name = "gN"; graph = "g0"; edgeColor = #3b82f6; edgeWidth = 26; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gA"; graph = "g1"; edgeColor = #3b82f6; edgeWidth = 26; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gB"; graph = "g2"; edgeColor = #f59e0b; edgeWidth = 26; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gAB"; graph = "g3"; edgeColor = #22c55e; edgeWidth = 26; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gW"; graph = "gw"; nodeRadius = 16; nodeColor = #3b82f633; labels = true; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gMA"; graph = "ga"; nodeRadius = 13; nodeColor = #3b82f6; labels = false; interactive = false; showWeights = false; layer = 7 }
draw Graph { name = "gMB"; graph = "gb"; nodeRadius = 13; nodeColor = #f59e0b; labels = false; interactive = false; showWeights = false; layer = 7 }
draw Graph { name = "gEm"; graph = "ge"; nodeRadius = 4; nodeColor = #3b82f6; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "tA"; pos = (-7.7, -2.7); text = "A"; size = 1.1; align = left; color = #3b82f6 }
draw Text { name = "tB"; pos = (-7.7, -3.9); text = "B"; size = 1.1; align = left; color = #f59e0b }
draw Text { name = "tO"; pos = (-7.7, 4.4); text = "Ω, P(ω)"; size = 0.9; align = left }

new UI { name = "sM"; type = select; label = "вероятность на Ω"; variable = md; options = ("fair", "load"); labels = ("равновозможные исходы", "P(ω) пропорциональна числу очков"); default = "fair" }

// ---- Логика ----
string md = "fair"; float clicks = 0; float key = -1;
list ma = [0, 1, 0, 1, 0, 1]; list mb = [0, 0, 0, 1, 1, 1];
string info = "";

Function wt(j) { if (md == "fair") { return 1; } return j + 1; }
Function tot() { if (md == "fair") { return 6; } return 21; }
Function fx(j) { return -6 + 2.4 * j; }
Function fr(s) { return format(s, 0) + "/" + format(tot(), 0) + " ≈ " + format(s / tot(), 3); }
Function bar(g, j) { addNode(g, "u" + format(j, 0), [fx(j), -0.6]); addNode(g, "v" + format(j, 0), [fx(j), -0.6 + 15 * wt(j) / tot()]); addEdge(g, "u" + format(j, 0), "v" + format(j, 0)); }

Update {
  if (mouseClickCount != clicks) {
    clicks = mouseClickCount;
    float c = round((mouseClickX + 6) / 2.4);
    if (c >= 0 && c <= 5 && abs(mouseClickX - fx(c)) < 1.1) {
      if (abs(mouseClickY + 2.7) < 0.6) { ma[c] = 1 - ma[c]; }
      if (abs(mouseClickY + 3.9) < 0.6) { mb[c] = 1 - mb[c]; }
    }
  }
  float kk = 0; repeat (6) { kk = kk + (ma[i] + 2 * mb[i]) * pow(4, i); }
  float kk2 = kk; if (md == "load") { kk2 = kk + 100000; }
  if (key != kk2) {
    g0 = newGraph(); g1 = newGraph(); g2 = newGraph(); g3 = newGraph(); gw = newGraph(); ga = newGraph(); gb = newGraph(); ge = newGraph();
    repeat (6) {
      float j = i;
      if (ma[j] == 1 && mb[j] == 1) { bar(g3, j); } if (ma[j] == 1 && mb[j] == 0) { bar(g1, j); }
      if (ma[j] == 0 && mb[j] == 1) { bar(g2, j); } if (ma[j] == 0 && mb[j] == 0) { bar(g0, j); }
      addNode(gw, "w" + format(j, 0), [fx(j), -1.5], format(j + 1, 0));
      if (ma[j] == 1) { addNode(ga, "a" + format(j, 0), [fx(j), -2.7]); } else { addNode(ge, "a" + format(j, 0), [fx(j), -2.7]); }
      if (mb[j] == 1) { addNode(gb, "b" + format(j, 0), [fx(j), -3.9]); } else { addNode(ge, "b" + format(j, 0), [fx(j), -3.9]); }
    }
    key = kk2;
  }
  float sa = 0; float sb = 0; float sab = 0; float su = 0;
  repeat (6) { float w = wt(i); sa = sa + w * ma[i]; sb = sb + w * mb[i]; sab = sab + w * ma[i] * mb[i]; su = su + w * max(ma[i], mb[i]); }
  string sA = ""; string sB = "";
  repeat (6) { if (ma[i] == 1) { sA = sA + format(i + 1, 0) + " "; } if (mb[i] == 1) { sB = sB + format(i + 1, 0) + " "; } }
  info = "**Модель случайности** — три уровня: пространство исходов Ω = {1, …, 6}, события — подмножества Ω, вероятность — функция на событиях. Здесь A = { " + sA + "}, B = { " + sB + "}.\n\n";
  info = info + "P(A) = " + fr(sa) + ", P(B) = " + fr(sb) + ", P(A ∩ B) = " + fr(sab) + ", P(A ∪ B) = " + fr(su) + ", P(Ā) = " + fr(tot() - sa) + ", P(Ω) = 1.\n\n";
  info = info + "**Сложение:** P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = " + format(sa, 0) + " + " + format(sb, 0) + " − " + format(sab, 0) + " = " + format(su, 0) + " (в долях от " + format(tot(), 0) + ").";
  if (sab == 0) { info = info + " A ∩ B = ∅: события **несовместны**, вероятности просто складываются."; }
  if (sa == 0) { info = info + " A = ∅ — невозможное событие, P = 0."; }
  if (sa == tot()) { info = info + " A = Ω — достоверное событие, P = 1."; }
  info = info + "\n\nКлик по клетке в строке A или B добавляет исход в событие или убирает его.";
}
]
