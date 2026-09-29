[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float k = 3; string rl = "sum"; string lr = ""; float lk = 0; float ed = 1; float clicks = 0; string info = "";
list E = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
draw Graph { name = "gI"; graph = "gi"; nodeColor = #3b82f6; nodeRadius = 20; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gJ"; graph = "gj"; nodeColor = #f59e0b; nodeRadius = 20; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gO"; graph = "go"; nodeRadius = 20; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 13; nodeColor = "transparent"; interactive = false; showWeights = false; layer = 5 }
new UI { name = "sk"; type = slider; label = "событий в группе"; variable = k; min = 2; max = 6; step = 1; default = 3 }
new UI { name = "sR"; type = select; label = "разбиение"; variable = rl; options = ("sum", "row", "max", "none"); labels = ("по остатку суммы", "по остатку a", "по остатку max(a, b)", "пустые события"); default = "sum" }
new UI { name = "sE"; type = slider; label = "щелчок правит событие №"; variable = ed; min = 1; max = k; step = 1; default = 1 }
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
Function cl(p, r, c) { float q = r + c; if (p == "row") { q = r; } if (p == "max") { q = max(r, c); } return q - k * floor(q / k); }
Update {
  if (rl != lr || k != lk) { lr = rl; lk = k; repeat (216) { E[i] = 0; } if (rl != "none") { repeat (36) { float r = floor(i / 6); float c = i - 6 * r; E[cl(rl, r, c) * 36 + i] = 1; } } }
  if (mouseClickCount != clicks) { clicks = mouseClickCount; float q = cellOf(mouseClickX, mouseClickY); if (q >= 0) { E[(ed - 1) * 36 + q] = 1 - E[(ed - 1) * 36 + q]; } }
  gi = newGraph(); gj = newGraph(); go = newGraph(); float ov = 0; float un = 0; float tot = 0; string ps = ""; string sm = "";
  repeat (36) { float r = floor(i / 6); float c = i - 6 * r; float t = 0; string lb = ""; float j = 0;
    repeat (k) { if (E[j * 36 + r * 6 + c] == 1) { t = t + 1; lb = lb + format(j + 1, 0); } j = j + 1; }
    string key = "n" + format(r * 6 + c, 0);
    if (t == 0) { addNode(go, key, [cx(c), cy(r)]); un = un + 1; } if (t == 1) { addNode(gi, key, [cx(c), cy(r)], lb); } if (t > 1) { addNode(gj, key, [cx(c), cy(r)], lb); ov = ov + 1; } }
  repeat (k) { float n = 0; float j = i; repeat (36) { n = n + E[j * 36 + i]; } tot = tot + n; if (j > 0) { ps = ps + " + "; sm = sm + ", "; } ps = ps + pr(n); sm = sm + "|A" + format(j + 1, 0) + "| = " + format(n, 0); }
  ga = newGraph(); repeat (6) { addNode(ga, "r" + format(i, 0), [cx(-1), cy(i)], format(i + 1, 0)); addNode(ga, "c" + format(i, 0), [cx(i), cy(-1)], format(i + 1, 0)); } addNode(ga, "ta", [cx(-1), cy(-1)], "a\\b");
  info = "**Полная группа событий** A₁, …, Aₖ — попарно несовместные события, объединение которых достоверно: в каждом опыте наступает ровно одно. Синяя клетка — исход ровно одного события (цифра — какого), жёлтая — исход нескольких сразу, серая — исход не входит ни в одно.\n\n";
  info = info + "Событий k = " + format(k, 0) + ": " + sm + ". Сумма вероятностей: " + ps + " = " + format(tot, 0) + "/36.\n\n";
  if (ov == 0 && un == 0) { info = info + "**Это полная группа:** пересечений нет, объединение — весь Ω, сумма вероятностей равна 1."; }
  else { info = info + "**Это не полная группа:** "; if (ov > 0) { info = info + format(ov, 0) + " исходов лежат в нескольких событиях сразу (нет попарной несовместности). "; } if (un > 0) { info = info + format(un, 0) + " исходов не попали ни в одно событие (объединение не равно Ω)."; } }
}
]
