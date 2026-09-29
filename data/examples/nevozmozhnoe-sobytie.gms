[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float sm = 5; float pd = 6; string info = "";
draw Graph { name = "gC"; graph = "gc"; nodeColor = #22c55e; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gI"; graph = "gi"; nodeColor = #3b82f6; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gJ"; graph = "gj"; nodeColor = #f59e0b; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gO"; graph = "go"; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 13; nodeColor = "transparent"; interactive = false; showWeights = false; layer = 5 }
new UI { name = "ss"; type = slider; label = "сумма очков a + b"; variable = sm; min = 1; max = 13; step = 1; default = 5 }
new UI { name = "sp"; type = slider; label = "произведение a · b"; variable = pd; min = 1; max = 36; step = 1; default = 6 }
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
  gi = newGraph(); gj = newGraph(); gc = newGraph(); go = newGraph(); float na = 0; float nb = 0; float nc = 0;
  repeat (36) { float r = floor(i / 6); float c = i - 6 * r; float ina = 0; if (r + c + 2 == sm) { ina = 1; na = na + 1; } float inb = 0; if ((r + 1) * (c + 1) == pd) { inb = 1; nb = nb + 1; }
    string k = "n" + format(i, 0);
    if (ina == 1 && inb == 1) { addNode(gc, k, [cx(c), cy(r)]); nc = nc + 1; } else { if (ina == 1) { addNode(gi, k, [cx(c), cy(r)]); } else { if (inb == 1) { addNode(gj, k, [cx(c), cy(r)]); } else { addNode(go, k, [cx(c), cy(r)]); } } } }
  ga = newGraph(); repeat (6) { addNode(ga, "r" + format(i, 0), [cx(-1), cy(i)], format(i + 1, 0)); addNode(ga, "c" + format(i, 0), [cx(i), cy(-1)], format(i + 1, 0)); } addNode(ga, "ta", [cx(-1), cy(-1)], "a\\b");
  info = "**Невозможное событие** — пустое множество исходов ∅: ни один результат эксперимента в него не входит, поэтому оно не наступает никогда, и P(∅) = 0. Пересечение с любым событием — снова ∅, объединение с ∅ ничего не меняет.\n\n";
  info = info + "Событие A: «a + b = " + format(sm, 0) + "» (синие клетки), |A| = " + format(na, 0) + ". Событие B: «a · b = " + format(pd, 0) + "» (жёлтые), |B| = " + format(nb, 0) + ". ";
  if (na == 0) { info = info + "**A = ∅** — такой суммы на двух костях не бывает. "; }
  if (nb == 0) { info = info + "**B = ∅** — такого произведения не бывает. "; }
  if (nc == 0) { info = info + "**A ∩ B = ∅ — невозможное событие**, P(A ∩ B) = 0; при этом A ∪ (A ∩ B) = A."; }
  else { info = info + "A ∩ B (зелёные) состоит из " + format(nc, 0) + " исходов, P(A ∩ B) = " + pr(nc) + " — событие возможно."; }
}
]
