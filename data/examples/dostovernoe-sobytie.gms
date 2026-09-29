[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string pb = "eq"; float lo = 2; float hi = 12; string info = "";
draw Graph { name = "gB"; graph = "gb"; nodeColor = #f59e0b; nodeRadius = 27; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gI"; graph = "gi"; nodeColor = #3b82f6; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gO"; graph = "go"; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 13; nodeColor = "transparent"; interactive = false; showWeights = false; layer = 5 }
new UI { name = "sl"; type = slider; label = "сумма не меньше"; variable = lo; min = 2; max = 12; step = 1; default = 2 }
new UI { name = "sh"; type = slider; label = "сумма не больше"; variable = hi; min = 2; max = 12; step = 1; default = 12 }
new UI { name = "sP"; type = select; label = "другое событие B"; variable = pb; options = ("none", "even", "gt7", "eq", "six", "lt", "odda", "le4", "nosix"); labels = ("пусто ∅", "сумма чётна", "сумма больше 7", "a = b", "есть шестёрка", "a < b", "a чётно", "сумма не больше 4", "шестёрок нет"); default = "eq" }
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
  gi = newGraph(); go = newGraph(); gb = newGraph(); float n = 0; float nb = 0; float nab = 0; float miss = -1;
  repeat (36) { float r = floor(i / 6); float c = i - 6 * r; float s = r + c + 2; float ina = 0; if (s >= lo && s <= hi) { ina = 1; } float inb = pre(pb, i);
    if (ina == 1) { addNode(gi, "n" + format(i, 0), [cx(c), cy(r)]); n = n + 1; } else { addNode(go, "n" + format(i, 0), [cx(c), cy(r)]); if (miss < 0) { miss = i; } }
    if (inb == 1) { addNode(gb, "b" + format(i, 0), [cx(c), cy(r)]); nb = nb + 1; if (ina == 1) { nab = nab + 1; } } }
  ga = newGraph(); repeat (6) { addNode(ga, "r" + format(i, 0), [cx(-1), cy(i)], format(i + 1, 0)); addNode(ga, "c" + format(i, 0), [cx(i), cy(-1)], format(i + 1, 0)); } addNode(ga, "ta", [cx(-1), cy(-1)], "a\\b");
  info = "**Достоверное событие** — всё пространство Ω: оно наступает при любом исходе, его вероятность P(Ω) = 1 по аксиоме нормировки. Событие A: «сумма очков от " + format(lo, 0) + " до " + format(hi, 0) + "» (синие клетки), рамкой отмечено B: " + pn(pb) + ".\n\n";
  info = info + "|A| = " + format(n, 0) + " из 36, P(A) = " + pr(n) + ". ";
  if (n == 36) { info = info + "**A = Ω — достоверное событие.** Тогда A ∩ B = B (" + format(nab, 0) + " = " + format(nb, 0) + " исходов), A ∪ B = A = Ω, а противоположное к A — невозможное событие."; }
  else { info = info + "**A ≠ Ω, событие не достоверное:** " + format(36 - n, 0) + " исходов в нём нет, например ω = (" + format(floor(miss / 6) + 1, 0) + ", " + format(miss - 6 * floor(miss / 6) + 1, 0) + "). Здесь A ∩ B содержит " + format(nab, 0) + " из " + format(nb, 0) + " исходов B."; }
  info = info + " Вероятность 1 у события ещё не значит, что оно достоверное, но на конечном Ω с равновозможными исходами так и есть.";
}
]
