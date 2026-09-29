[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string md = "sum"; float sel = 21; float clicks = 0; string info = "";
draw Graph { name = "gH"; graph = "gh"; nodeColor = #f59e0b; nodeRadius = 27; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gG"; graph = "gg"; nodeRadius = 20; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "g0"; graph = "g0"; nodeColor = #3b82f6; nodeRadius = 20; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "g1"; graph = "g1"; nodeColor = #22c55e; nodeRadius = 20; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "g2"; graph = "g2"; nodeColor = #f59e0b; nodeRadius = 20; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 13; nodeColor = "transparent"; interactive = false; showWeights = false; layer = 5 }
new UI { name = "sM"; type = select; label = "что считать исходом"; variable = md; options = ("pair", "sum", "max", "par"); labels = ("упорядоченная пара (a, b)", "сумма a + b", "наибольшее max(a, b)", "чётность суммы"); default = "sum" }
Function cx(c) { return -3.25 + 1.3 * c; }
Function cy(r) { return 3.25 - 1.3 * r; }
Function cls(k) { float r = floor(k / 6); float c = k - 6 * r;
  if (md == "pair") { return k; } if (md == "sum") { return r + c; } if (md == "max") { return max(r, c); }
  return r + c - 2 * floor((r + c) / 2); }
Function lab(k) { float r = floor(k / 6); float c = k - 6 * r;
  if (md == "pair") { return format(r + 1, 0) + "," + format(c + 1, 0); } if (md == "sum") { return format(r + c + 2, 0); }
  if (md == "max") { return format(max(r, c) + 1, 0); } if (r + c - 2 * floor((r + c) / 2) == 0) { return "чёт"; } return "нечёт"; }
Function omega() { if (md == "pair") { return "{(a, b) : a, b = 1…6}"; } if (md == "sum") { return "{2, 3, …, 12}"; } if (md == "max") { return "{1, 2, …, 6}"; } return "{чёт, нечёт}"; }
Function nOm() { if (md == "pair") { return 36; } if (md == "sum") { return 11; } if (md == "max") { return 6; } return 2; }
Update {
  if (mouseClickCount != clicks) { clicks = mouseClickCount;
    float j0 = floor((mouseClickX - cx(0)) / 1.3 + 0.5); float i0 = floor((cy(0) - mouseClickY) / 1.3 + 0.5);
    if (i0 >= 0 && i0 < 6 && j0 >= 0 && j0 < 6) { sel = i0 * 6 + j0; } }
  gg = newGraph(); g0 = newGraph(); g1 = newGraph(); g2 = newGraph(); gh = newGraph(); ga = newGraph();
  float cn = 0; float cs0 = cls(sel);
  repeat (36) { float k = i; float r = floor(k / 6); float c = k - 6 * r; float q = cls(k);
    string key = "n" + format(k, 0);
    if (md == "pair") { addNode(gg, key, [cx(c), cy(r)], lab(k)); }
    else { float m3 = q - 3 * floor(q / 3);
      if (m3 == 0) { addNode(g0, key, [cx(c), cy(r)], lab(k)); } if (m3 == 1) { addNode(g1, key, [cx(c), cy(r)], lab(k)); } if (m3 == 2) { addNode(g2, key, [cx(c), cy(r)], lab(k)); } }
    if (q == cs0) { addNode(gh, key, [cx(c), cy(r)]); cn = cn + 1; } }
  repeat (6) { addNode(ga, "r" + format(i, 0), [cx(-1), cy(i)], format(i + 1, 0)); addNode(ga, "c" + format(i, 0), [cx(i), cy(-1)], format(i + 1, 0)); }
  addNode(ga, "ta", [cx(-1), cy(-1)], "a\\b");
  float sr = floor(sel / 6); float sc = sel - 6 * sr;
  info = "**Пространство элементарных событий** Ω — множество всех элементарных исходов ω эксперимента: каждый исход — один полный, неделимый результат, а в каждом опыте реализуется ровно один. Эксперимент: две игральные кости, на поле — 36 физически различных результатов (a, b). Выбор Ω неоднозначен: он зависит от того, что считать существенным.\n\n";
  info = info + "**Сейчас** Ω = " + omega() + ", |Ω| = " + format(nOm(), 0) + ". ";
  info = info + "Выпало (a, b) = (" + format(sr + 1, 0) + ", " + format(sc + 1, 0) + "): реализовался ровно один исход ω = " + lab(sel) + ", ему отвечают " + format(cn, 0) + " из 36 результатов (выделены).";
  if (md == "sum") { info = info + " Исходы суммы не равновозможны: сумме 7 отвечают 6 результатов, а сумме 2 — один."; }
}
]
