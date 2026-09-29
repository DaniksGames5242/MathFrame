[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string pa = "lt"; string pb = "eq"; string pc = "even"; string la = ""; string lb = ""; string lc = ""; string ed = "A"; float clicks = 0; string info = "";
list MA = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list MB = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list MC = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
draw Graph { name = "gI"; graph = "gi"; nodeColor = #3b82f6; nodeRadius = 20; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gJ"; graph = "gj"; nodeColor = #f59e0b; nodeRadius = 20; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gO"; graph = "go"; nodeRadius = 20; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 13; nodeColor = "transparent"; interactive = false; showWeights = false; layer = 5 }
new UI { name = "sA"; type = select; label = "событие A"; variable = pa; options = ("none", "even", "gt7", "eq", "six", "lt", "odda", "le4", "nosix"); labels = ("пусто ∅", "сумма чётна", "сумма больше 7", "a = b", "есть шестёрка", "a < b", "a чётно", "сумма не больше 4", "шестёрок нет"); default = "lt" }
new UI { name = "sB"; type = select; label = "событие B"; variable = pb; options = ("none", "even", "gt7", "eq", "six", "lt", "odda", "le4", "nosix"); labels = ("пусто ∅", "сумма чётна", "сумма больше 7", "a = b", "есть шестёрка", "a < b", "a чётно", "сумма не больше 4", "шестёрок нет"); default = "eq" }
new UI { name = "sC"; type = select; label = "событие C"; variable = pc; options = ("none", "even", "gt7", "eq", "six", "lt", "odda", "le4", "nosix"); labels = ("пусто ∅", "сумма чётна", "сумма больше 7", "a = b", "есть шестёрка", "a < b", "a чётно", "сумма не больше 4", "шестёрок нет"); default = "even" }
new UI { name = "sE"; type = select; label = "щелчок правит"; variable = ed; options = ("A", "B", "C"); labels = ("событие A", "событие B", "событие C"); default = "A" }
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
Function nm(x, s) { if (x == 1) { return s; } return ""; }
Update {
  if (pa != la) { la = pa; repeat (36) { MA[i] = pre(pa, i); } }
  if (pb != lb) { lb = pb; repeat (36) { MB[i] = pre(pb, i); } }
  if (pc != lc) { lc = pc; repeat (36) { MC[i] = pre(pc, i); } }
  if (mouseClickCount != clicks) { clicks = mouseClickCount; float q = cellOf(mouseClickX, mouseClickY);
    if (q >= 0) { if (ed == "A") { MA[q] = 1 - MA[q]; } if (ed == "B") { MB[q] = 1 - MB[q]; } if (ed == "C") { MC[q] = 1 - MC[q]; } } }
  gi = newGraph(); gj = newGraph(); go = newGraph(); float nab = 0; float nac = 0; float nbc = 0; float nabc = 0; float na = 0; float nb = 0; float nc = 0;
  repeat (36) { float r = floor(i / 6); float c = i - 6 * r; string k = "n" + format(i, 0); float t = MA[i] + MB[i] + MC[i]; string lb2 = nm(MA[i], "A") + nm(MB[i], "B") + nm(MC[i], "C");
    na = na + MA[i]; nb = nb + MB[i]; nc = nc + MC[i]; nab = nab + MA[i] * MB[i]; nac = nac + MA[i] * MC[i]; nbc = nbc + MB[i] * MC[i]; nabc = nabc + MA[i] * MB[i] * MC[i];
    if (t == 0) { addNode(go, k, [cx(c), cy(r)]); } if (t == 1) { addNode(gi, k, [cx(c), cy(r)], lb2); } if (t > 1) { addNode(gj, k, [cx(c), cy(r)], lb2); } }
  ga = newGraph(); repeat (6) { addNode(ga, "r" + format(i, 0), [cx(-1), cy(i)], format(i + 1, 0)); addNode(ga, "c" + format(i, 0), [cx(i), cy(-1)], format(i + 1, 0)); } addNode(ga, "ta", [cx(-1), cy(-1)], "a\\b");
  info = "**Несовместные события** — события с пустым пересечением: в одном опыте они не наступают одновременно. Попарно несовместными называют систему, где несовместны любые два события. Синие клетки — исходы ровно одного из A, B, C (буква — какого), жёлтые — исходы нескольких сразу.\n\n";
  info = info + "|A ∩ B| = " + format(nab, 0) + ", |A ∩ C| = " + format(nac, 0) + ", |B ∩ C| = " + format(nbc, 0) + ", |A ∩ B ∩ C| = " + format(nabc, 0) + ". ";
  if (nab + nac + nbc == 0) { info = info + "**Все три пары несовместны** — система попарно несовместна, поэтому P(A ∪ B ∪ C) = P(A) + P(B) + P(C) = " + pr(na + nb + nc) + "."; }
  else { info = info + "Несовместны пары: "; string z = ""; if (nab == 0) { z = z + "A и B; "; } if (nac == 0) { z = z + "A и C; "; } if (nbc == 0) { z = z + "B и C; "; } if (z == "") { z = "нет"; } info = info + z;
    if (nabc == 0) { info = info + " Общего исхода у всех трёх нет, но попарно они пересекаются — этого недостаточно для попарной несовместности."; } }
}
]
