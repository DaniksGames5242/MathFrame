[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string pa = "gt7"; string pb = "eq"; string la = ""; string lb = ""; float cust = 0; float clicks = 0; string info = "";
list M = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
draw Graph { name = "gB"; graph = "gb"; nodeColor = #22c55e; nodeRadius = 27; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gI"; graph = "gi"; nodeColor = #3b82f6; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gJ"; graph = "gj"; nodeColor = #f59e0b; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 13; nodeColor = "transparent"; interactive = false; showWeights = false; layer = 5 }
new UI { name = "sA"; type = select; label = "событие A"; variable = pa; options = ("none", "even", "gt7", "eq", "six", "lt", "odda", "le4", "nosix"); labels = ("пусто ∅", "сумма чётна", "сумма больше 7", "a = b", "есть шестёрка", "a < b", "a чётно", "сумма не больше 4", "шестёрок нет"); default = "gt7" }
new UI { name = "sB"; type = select; label = "другое событие B"; variable = pb; options = ("none", "even", "gt7", "eq", "six", "lt", "odda", "le4", "nosix"); labels = ("пусто ∅", "сумма чётна", "сумма больше 7", "a = b", "есть шестёрка", "a < b", "a чётно", "сумма не больше 4", "шестёрок нет"); default = "eq" }
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
  if (pa != la) { la = pa; cust = 0; repeat (36) { M[i] = pre(pa, i); } }
  if (mouseClickCount != clicks) { clicks = mouseClickCount; float q = cellOf(mouseClickX, mouseClickY); if (q >= 0) { M[q] = 1 - M[q]; cust = 1; } }
  gi = newGraph(); gj = newGraph(); gb = newGraph(); float n = 0; float nb = 0; float u = 0; float x = 0; float y = 0; float w = 0;
  repeat (36) { float r = floor(i / 6); float c = i - 6 * r; float ina = M[i]; float inb = pre(pb, i); string k = "n" + format(i, 0);
    if (ina == 1) { addNode(gi, k, [cx(c), cy(r)]); n = n + 1; } else { addNode(gj, k, [cx(c), cy(r)]); }
    if (inb == 1) { addNode(gb, "b" + format(i, 0), [cx(c), cy(r)]); nb = nb + 1; }
    if (ina == 0 && inb == 0) { x = x + 1; } if (ina == 0 || inb == 0) { y = y + 1; } if (ina == 1 && inb == 1) { w = w + 1; } if (ina == 1 || inb == 1) { u = u + 1; } }
  ga = newGraph(); repeat (6) { addNode(ga, "r" + format(i, 0), [cx(-1), cy(i)], format(i + 1, 0)); addNode(ga, "c" + format(i, 0), [cx(i), cy(-1)], format(i + 1, 0)); } addNode(ga, "ta", [cx(-1), cy(-1)], "a\\b");
  string nm = pn(pa); if (cust == 1) { nm = "множество, заданное вручную"; }
  info = "**Противоположное событие** Ā — дополнение A до Ω: все исходы, в которых A не наступает. Синие клетки — A (" + nm + "), жёлтые — Ā.\n\n";
  info = info + "|A| = " + format(n, 0) + ", |Ā| = " + format(36 - n, 0) + ": P(A) + P(Ā) = " + pr(n) + " + " + pr(36 - n) + " = 1, то есть P(Ā) = 1 − P(A) = " + pr(36 - n) + ". A ∩ Ā = ∅, A ∪ Ā = Ω; противоположное к Ā — снова A.\n\n";
  info = info + "**Законы де Моргана** для A и B (рамка — B, |B| = " + format(nb, 0) + "): противоположное к A ∪ B содержит " + format(36 - u, 0) + " исходов, а Ā ∩ B̄ — " + format(x, 0) + "; противоположное к A ∩ B — " + format(36 - w, 0) + ", а Ā ∪ B̄ — " + format(y, 0) + ".";
}
]
