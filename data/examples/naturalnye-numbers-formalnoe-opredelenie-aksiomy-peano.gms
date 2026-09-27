[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Структура «множество + единица + функция следования S» (стрелка n → S(n)).
// Настоящие натуральные числа и четыре «подделки», каждая нарушает ровно одну аксиому Пеано.
// Справа — проверка аксиом; красные узлы — где нарушение. Кнопка «Индукция» строит множество M:
// кладём 1 и шаг за шагом добавляем S(n) — зелёные узлы. ----
draw Graph { name = "gAll"; graph = "ga"; nodeColor = #6b7280; edgeColor = #6b7280; nodeRadius = 15; directed = true; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gBad"; graph = "gr"; nodeColor = #ef4444; nodeRadius = 17; interactive = false; showWeights = false; layer = 12 }
draw Graph { name = "gInd"; graph = "gi"; nodeColor = #22c55e; nodeRadius = 15; interactive = false; showWeights = false; layer = 14 }
draw Graph { name = "gOk"; graph = "gok"; nodeColor = #22c55e; nodeRadius = 11; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gNo"; graph = "gno"; nodeColor = #ef4444; nodeRadius = 11; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "a1"; pos = (3.6, 3.6); text = "1. 1 — натуральное число"; size = 0.95; align = left }
draw Text { name = "a2"; pos = (3.6, 2.6); text = "2. у каждого n есть S(n)"; size = 0.95; align = left }
draw Text { name = "a3"; pos = (3.6, 1.6); text = "3. S(n) ≠ 1 ни для какого n"; size = 0.95; align = left }
draw Text { name = "a4"; pos = (3.6, 0.6); text = "4. S(m) = S(n) ⇒ m = n"; size = 0.95; align = left }
draw Text { name = "a5"; pos = (3.6, -0.4); text = "5. аксиома индукции"; size = 0.95; align = left }
draw Text { name = "dots"; pos = (dotsX, dotsY); text = "…"; size = 1.6; active = model == "nat" || model == "extra" }
draw Text { name = "dots2"; pos = (0.3, -2.6); text = "…"; size = 1.6; active = model == "extra" }

new UI { name = "sM"; type = select; label = "структура"; variable = model; options = ("nat", "loop", "merge", "end", "extra"); labels = ("натуральные числа ℕ", "цикл 1 → … → 5 → 1", "склейка: S(1) = S(4)", "обрыв: у 4 нет S(4)", "ℕ и ещё одна цепочка"); default = "nat" }
new UI { name = "bI"; type = button; label = "Индукция"; action = "indGo = 1" }

// ---- Логика ----
string model = "nat"; string lastModel = "";
float indGo = 0; float indStep = -1; float lastT = 0;
float dotsX = 0; float dotsY = 0;
list ok = (1, 1, 1, 1, 1);
string why = "";
string info = "";

Function nd(k) { return format(k, 0); }
Function node(g, k, x, y) { addNode(g, nd(k), [x, y]); return 0; }
Function place(g, k) {
  if (model == "nat") { node(g, k, -7.4 + 1.35 * (k - 1), 1); }
  if (model == "loop") { float a = pi / 2 - 2 * pi * (k - 1) / 5; node(g, k, -2.6 + 2.4 * cos(a), 0.6 + 2.4 * sin(a)); }
  if (model == "merge") { if (k == 1) { node(g, k, -6.6, 2.4); } if (k > 1) { float a = pi - 2 * pi * (k - 2) / 3; node(g, k, -3.6 + 1.9 * cos(a), 0.4 + 1.9 * sin(a)); } }
  if (model == "end") { node(g, k, -7 + 1.6 * (k - 1), 1); }
  if (model == "extra") { if (k <= 6) { node(g, k, -7.4 + 1.35 * (k - 1), 2); } else { addNode(g, "b" + nd(k - 6), [-7.4 + 1.35 * (k - 7) + 0.6, -2.6], nd(k - 6) + "′"); } }
  return 0;
}
Function nNodes() { if (model == "nat") { return 7; } if (model == "loop") { return 5; } if (model == "merge") { return 4; } if (model == "end") { return 4; } return 11; }
// следующий за k (0 — нет следующего)
Function nxt(k) {
  if (model == "nat") { if (k < 7) { return k + 1; } return 0; }
  if (model == "loop") { if (k < 5) { return k + 1; } return 1; }
  if (model == "merge") { if (k < 4) { return k + 1; } return 2; }
  if (model == "end") { if (k < 4) { return k + 1; } return 0; }
  if (k < 6 || (k > 6 && k < 11)) { return k + 1; } return 0;
}
Function key(k) { if (model == "extra" && k > 6) { return "b" + nd(k - 6); } return nd(k); }

Update {
  if (model != lastModel) {
    ga = newGraph(); gr = newGraph(); gi = newGraph();
    repeat (nNodes()) { place(ga, i + 1); }
    repeat (nNodes()) { float k = i + 1; float s = nxt(k); if (s > 0) { addEdge(ga, key(k), key(s)); } }
    repeat (5) { ok[i] = 1; }
    why = "";
    if (model == "loop") { ok[2] = 0; place(gr, 1); why = "S(5) = 1: единица оказалась чьим-то «следующим» — нарушена аксиома 3. Такая структура — остатки по модулю 5, а не натуральные числа."; }
    if (model == "merge") { ok[3] = 0; place(gr, 2); why = "S(1) = S(4) = 2 при 1 ≠ 4 — нарушена аксиома 4 (S не инъективна): у двойки два «предыдущих»."; }
    if (model == "end") { ok[1] = 0; place(gr, 4); why = "У 4 нет следующего — нарушена аксиома 2: множество конечно."; }
    if (model == "extra") { ok[4] = 0; repeat (5) { place(gr, 7 + i); } why = "Аксиомы 1–4 выполнены, но к цепочке 1′ → 2′ → … от единицы не дойти: множество M, построенное индукцией, — только верхняя цепочка, M ≠ всё множество. Нарушена аксиома индукции — именно она отсекает «лишние» элементы."; }
    if (model == "nat") { why = "Все пять аксиом выполнены. Любые две структуры, удовлетворяющие им, устроены одинаково (изоморфны) — поэтому аксиомы Пеано определяют натуральные числа однозначно."; }
    gok = newGraph(); gno = newGraph();
    repeat (5) { if (ok[i] == 1) { addNode(gok, "o" + nd(i), [3.2, 3.6 - i]); } else { addNode(gno, "o" + nd(i), [3.2, 3.6 - i]); } }
    dotsX = -7.4 + 1.35 * 7 - 0.2; dotsY = 1;
    if (model == "extra") { dotsX = -7.4 + 1.35 * 6 - 0.2; dotsY = 2; }
    indStep = -1; lastModel = model;
  }
  // Индукция: каждые 0.5 с добавляем в M следующий элемент
  if (indGo == 1) { gi = newGraph(); indStep = 0; lastT = time; indGo = 0; place(gi, 1); }
  if (indStep >= 0 && time - lastT > 0.5) {
    lastT = time;
    float cur = 1; repeat (indStep) { if (cur > 0) { cur = nxt(cur); } }
    float s = 0; if (cur > 0) { s = nxt(cur); }
    if (s > 0 && s != 1 && indStep < 12) { place(gi, s); indStep = indStep + 1; } else { indStep = -1; }
  }

  info = "**Аксиомы Пеано** определяют натуральные числа через единицу 1 и функцию следования S(n) = «n + 1»: (1) 1 — натуральное число; (2) у каждого натурального n есть следующее S(n); (3) единица не следует ни за каким числом; (4) разные числа имеют разных последователей; (5) аксиома индукции: если множество M содержит 1 и вместе с каждым n содержит S(n), то M содержит все натуральные числа. Сложение, умножение и порядок определяются потом через S.\n\n" + why + "\n\nКнопка «Индукция» строит множество M шаг за шагом (зелёные).";
}
]
