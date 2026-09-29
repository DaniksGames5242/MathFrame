[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string pa = "even"; string pb = "gt7"; string la = ""; string lb = ""; string ed = "A"; float clicks = 0; string info = "";
list MA = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list MB = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
draw Graph { name = "gI"; graph = "gi"; nodeColor = #3b82f6; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gJ"; graph = "gj"; nodeColor = #f59e0b; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "gc"; nodeColor = #22c55e; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gO"; graph = "go"; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 13; nodeColor = "transparent"; interactive = false; showWeights = false; layer = 5 }
new UI { name = "sA"; type = select; label = "событие A"; variable = pa; options = ("none", "even", "gt7", "eq", "six", "lt", "odda", "le4", "nosix"); labels = ("пусто ∅", "сумма чётна", "сумма больше 7", "a = b", "есть шестёрка", "a < b", "a чётно", "сумма не больше 4", "шестёрок нет"); default = "even" }
new UI { name = "sB"; type = select; label = "событие B"; variable = pb; options = ("none", "even", "gt7", "eq", "six", "lt", "odda", "le4", "nosix"); labels = ("пусто ∅", "сумма чётна", "сумма больше 7", "a = b", "есть шестёрка", "a < b", "a чётно", "сумма не больше 4", "шестёрок нет"); default = "gt7" }
new UI { name = "sE"; type = select; label = "щелчок правит"; variable = ed; options = ("A", "B"); labels = ("событие A", "событие B"); default = "A" }
Function cx(c) { return -3.25 + 1.3 * c; }
Function cy(r) { return 3.25 - 1.3 * r; }
Function pre(p, k) { float r = floor(k / 6); float c = k - 6 * r; float a = r + 1; float b = c + 1; float s = a + b;
  if (p == "even") { if (s - 2 * floor(s / 2) == 0) { return 1; } return 0; }
  if (p == "gt7") { if (s > 7) { return 1; } return 0; }
  if (p == "eq") { if (a == b) { return 1; } return 0; }
  if (p == "six") { if (a == 6 || b == 6) { return 1; } return 0; }
  if (p == "lt") { if (a < b) { return 1; } return 0; }
  if (p == "odda") { if (a - 2 * floor(a / 2) == 0) { return 1; } return 0; }
  if (p == "le4") { if (s <= 4) { return 1; } return 0; }
  if (p == "nosix") { if (a < 6 && b < 6) { return 1; } return 0; }
  return 0; }
Function pn(p) { if (p == "even") { return "сумма очков чётна"; } if (p == "gt7") { return "сумма очков больше 7"; } if (p == "eq") { return "a = b"; } if (p == "six") { return "выпала хотя бы одна шестёрка"; }
  if (p == "lt") { return "a < b"; } if (p == "odda") { return "на первой кости чётное число"; } if (p == "le4") { return "сумма очков не больше 4"; } if (p == "nosix") { return "шестёрок нет"; } return "∅ (ни одного исхода)"; }
Function cellOf(mx, my) { float j0 = floor((mx - cx(0)) / 1.3 + 0.5); float i0 = floor((cy(0) - my) / 1.3 + 0.5);
  if (i0 >= 0 && i0 < 6 && j0 >= 0 && j0 < 6) { return i0 * 6 + j0; } return -1; }
Function pr(n) { return format(n, 0) + "/36"; }
Update {
  if (pa != la) { la = pa; repeat (36) { MA[i] = pre(pa, i); } }
  if (pb != lb) { lb = pb; repeat (36) { MB[i] = pre(pb, i); } }
  if (mouseClickCount != clicks) { clicks = mouseClickCount; float q = cellOf(mouseClickX, mouseClickY);
    if (q >= 0) { if (ed == "A") { MA[q] = 1 - MA[q]; } else { MB[q] = 1 - MB[q]; } } }
  gi = newGraph(); gj = newGraph(); gc = newGraph(); go = newGraph(); float na = 0; float nb = 0; float nc = 0; float ex = -1;
  repeat (36) { float r = floor(i / 6); float c = i - 6 * r; string k = "n" + format(i, 0); na = na + MA[i]; nb = nb + MB[i];
    if (MA[i] == 1 && MB[i] == 1) { addNode(gc, k, [cx(c), cy(r)]); nc = nc + 1; if (ex < 0) { ex = i; } } else { if (MA[i] == 1) { addNode(gi, k, [cx(c), cy(r)]); } else { if (MB[i] == 1) { addNode(gj, k, [cx(c), cy(r)]); } else { addNode(go, k, [cx(c), cy(r)]); } } } }
  ga = newGraph(); repeat (6) { addNode(ga, "r" + format(i, 0), [cx(-1), cy(i)], format(i + 1, 0)); addNode(ga, "c" + format(i, 0), [cx(i), cy(-1)], format(i + 1, 0)); } addNode(ga, "ta", [cx(-1), cy(-1)], "a\\b");
  info = "**Совместные события** — события A и B, у которых пересечение A ∩ B непусто: есть исход, при котором наступают оба сразу. Синие клетки — только A, жёлтые — только B, зелёные — оба.\n\n";
  info = info + "|A| = " + format(na, 0) + ", |B| = " + format(nb, 0) + ", |A ∩ B| = " + format(nc, 0) + ". ";
  if (nc > 0) { info = info + "**A ∩ B ≠ ∅ — события совместны**, общий исход, например ω = (" + format(floor(ex / 6) + 1, 0) + ", " + format(ex - 6 * floor(ex / 6) + 1, 0) + "). ";
    info = info + "Поэтому P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = " + pr(na) + " + " + pr(nb) + " − " + pr(nc) + " = " + pr(na + nb - nc) + ". ";
    if (nc == na || nc == nb) { info = info + "Вложенность здесь есть, но совместность от неё не зависит: достаточно общего исхода."; } else { info = info + "Ни одно из событий не влечёт другое — вложенности нет, а совместность есть."; } }
  else { info = info + "**A ∩ B = ∅ — события несовместны**, а не совместны: общих исходов нет, и P(A ∪ B) = " + pr(na + nb) + " без поправки."; }
}
]
