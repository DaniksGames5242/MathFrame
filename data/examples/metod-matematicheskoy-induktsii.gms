[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Домино P(1), P(2), …, P(20): зелёное — утверждение доказано индукцией
// (база P(1) верна и все шаги P(m) ⇒ P(m+1) до n верны), жёлтое — не доказано.
// Синим отмечен проверяемый шаг P(k) ⇒ P(k + 1). ----
string st = "A"; float K = 3; float key = -1; string info = "";
draw Graph { name = "vG"; graph = "gG"; edgeColor = #22c55e; edgeWidth = 12; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "vY"; graph = "gY"; edgeColor = #f59e0b; edgeWidth = 12; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "vK"; graph = "gK"; edgeColor = #3b82f6; edgeWidth = 3; nodeColor = #3b82f6; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 12 }
draw Graph { name = "vL"; graph = "gL"; nodeRadius = 0; labels = true; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "t1"; pos = (-9.7, 4.6); text = "P(n)"; size = 1; align = left }
new UI { name = "sT"; type = select; label = "утверждение"; variable = st; options = ("A", "B", "C"); labels = ("1 + 2 + … + n = n(n + 1)/2", "n = n + 1", "n² < 30"); default = "A" }
new UI { name = "sK"; type = slider; label = "k"; variable = K; min = 1; max = 19; step = 1; default = 3 }

Function P(n) {
  if (st == "A") { return 1; }
  if (st == "B") { return 0; }
  if (n * n < 30) { return 1; } return 0;
}
Function impl(k) { if (P(k) > 0.5) { if (P(k + 1) < 0.5) { return 0; } } return 1; }
Function px(n) { return -9.2 + 18.4 * (n - 0.5) / 20; }

Update {
  gG = newGraph(); gY = newGraph(); gK = newGraph(); gL = newGraph();
  float fall = P(1); float firstBad = 0;
  repeat (20) {
    float n = i + 1; string ns = format(n, 0);
    if (n > 1.5) { if (impl(n - 1) < 0.5) { if (firstBad < 0.5) { firstBad = n - 1; } fall = 0; } }
    addNode(gL, "l" + ns, [px(n), -3.4], ns);
    if (fall > 0.5) { addNode(gG, "a" + ns, [px(n), -2.7]); addNode(gG, "b" + ns, [px(n), 1.6]); addEdge(gG, "a" + ns, "b" + ns); }
    else { addNode(gY, "a" + ns, [px(n), -2.7]); addNode(gY, "b" + ns, [px(n), 1.6]); addEdge(gY, "a" + ns, "b" + ns); }
  }
  addNode(gK, "k1", [px(K), 2.6]); addNode(gK, "k2", [px(K + 1), 2.6]); addEdge(gK, "k1", "k2");
  string s = "";
  if (st == "A") { s = "Шаг: если 1 + … + k = k(k + 1)/2, то, прибавив k + 1, получаем k(k + 1)/2 + (k + 1) = (k + 1)(k + 2)/2 — это P(k + 1). Шаг верен при любом k. База: 1 = 1·2/2 верна."; }
  if (st == "B") { s = "Шаг: если k = k + 1, то, прибавив 1 к обеим частям, получаем k + 1 = k + 2 — шаг верен при любом k. Но **база** P(1): 1 = 2 неверна, и доказывать нечего."; }
  if (st == "C") {
    string k0 = format(K, 0); string k1 = format(K + 1, 0);
    s = "База: 1² = 1 < 30 верна. Шаг при k = " + k0 + ": ";
    if (K * K >= 30) { s = s + "P(k) неверно (" + format(K * K, 0) + " ≥ 30), так что допущения индукции нет."; }
    else { if ((K + 1) * (K + 1) >= 30) { s = s + "P(k) верно (" + format(K * K, 0) + " < 30), а P(k + 1) нет (" + format((K + 1) * (K + 1), 0) + " ≥ 30): **шаг не выполняется**."; } else { s = s + "P(k) верно (" + format(K * K, 0) + " < 30) и P(k + 1) тоже (" + format((K + 1) * (K + 1), 0) + " < 30)."; } }
  }
  info = "**Метод математической индукции:** утверждение P(n) верно для всех натуральных n, если верна **база** P(1) и верен **шаг** — из P(k) следует P(k + 1) при любом k. Тогда падает вся цепочка: P(1) ⇒ P(2) ⇒ P(3) ⇒ …\n\n" + s + "\n\n";
  if (fall > 0.5) { info = info + "Оба условия выполнены — P(n) доказано для всех n (зелёное)."; }
  else { if (P(1) < 0.5) { info = info + "База не выполнена — цепочка не начинается."; } else { info = info + "Цепочка обрывается на шаге P(" + format(firstBad, 0) + ") ⇒ P(" + format(firstBad + 1, 0) + "): дальше индукцией доказать нельзя (жёлтое)."; } }
}
]
