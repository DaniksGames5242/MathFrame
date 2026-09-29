[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string pp = "even"; string lp = ""; float cust = 0; float wa = 3; float wb = 4; float clicks = 0; string info = "";
list M = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
draw Graph { name = "gW"; graph = "gw"; nodeColor = #f59e0b; nodeRadius = 27; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gI"; graph = "gi"; nodeColor = #3b82f6; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gO"; graph = "go"; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 13; nodeColor = "transparent"; interactive = false; showWeights = false; layer = 5 }
new UI { name = "sP"; type = select; label = "событие A"; variable = pp; options = ("none", "even", "gt7", "eq", "six", "lt", "odda", "le4", "nosix"); labels = ("пусто ∅", "сумма чётна", "сумма больше 7", "a = b", "есть шестёрка", "a < b", "a чётно", "сумма не больше 4", "шестёрок нет"); default = "even" }
new UI { name = "sa"; type = slider; label = "выпало a"; variable = wa; min = 1; max = 6; step = 1; default = 3 }
new UI { name = "sb"; type = slider; label = "выпало b"; variable = wb; min = 1; max = 6; step = 1; default = 4 }
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
  if (pp != lp) { lp = pp; cust = 0; repeat (36) { M[i] = pre(pp, i); } }
  if (mouseClickCount != clicks) { clicks = mouseClickCount; float q = cellOf(mouseClickX, mouseClickY); if (q >= 0) { M[q] = 1 - M[q]; cust = 1; } }
  gi = newGraph(); go = newGraph(); gw = newGraph(); float n = 0;
  repeat (36) { float r = floor(i / 6); float c = i - 6 * r; if (M[i] == 1) { addNode(gi, "n" + format(i, 0), [cx(c), cy(r)]); n = n + 1; } else { addNode(go, "n" + format(i, 0), [cx(c), cy(r)]); } }
  addNode(gw, "w", [cx(wb - 1), cy(wa - 1)]);
  ga = newGraph(); repeat (6) { addNode(ga, "r" + format(i, 0), [cx(-1), cy(i)], format(i + 1, 0)); addNode(ga, "c" + format(i, 0), [cx(i), cy(-1)], format(i + 1, 0)); } addNode(ga, "ta", [cx(-1), cy(-1)], "a\\b");
  float w = (wa - 1) * 6 + wb - 1;
  info = "**Случайное событие** — подмножество A пространства элементарных событий Ω: набор исходов с общим наблюдаемым признаком. Событие наступило, если реализовавшийся исход ω лежит в A, и не наступило иначе. Синие клетки — исходы события A, рамка — результат опыта ω = (a, b).\n\n";
  string nm = pn(pp); if (cust == 1) { nm = "множество, заданное вручную"; }
  info = info + "**A:** " + nm + ", |A| = " + format(n, 0) + " из 36 исходов, P(A) = " + pr(n) + ". ";
  info = info + "Выпало ω = (" + format(wa, 0) + ", " + format(wb, 0) + "): ";
  if (M[w] == 1) { info = info + "ω ∈ A — событие **наступило**."; } else { info = info + "ω ∉ A — событие **не наступило**."; }
  info = info + " Событие — суждение о результате, у него ровно два значения; два события с одним и тем же множеством исходов равны. Щелчок по клетке добавляет или убирает исход.";
}
]
