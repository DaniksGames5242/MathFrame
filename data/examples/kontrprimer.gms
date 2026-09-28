[
description = "{info}"

field width = 18;
field height = 11;
camera type = fixed;

// ---- Три ложных «для всех n» утверждения; слайдер n ищет объект, на котором они
// нарушаются, — единственного контрпримера достаточно для опровержения. ----
draw Graph { name = "gB"; graph = "gb"; edgeWidth = 6; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gCur"; graph = "gc"; nodeColor = #f59e0b; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "tSt"; pos = (0, 4.7); text = stText; size = 1.1 }
draw Text { name = "tN"; pos = (0, 3.7); text = "n = " + format(n, 0) + ": " + checkText; size = 1.1; color = checkCol }

new UI { name = "sS"; type = select; label = "утверждение"; variable = st; options = ("odd", "sq", "div"); labels = ("все простые числа нечётны", "все нечётные числа простые", "если n² делится на 4, то n делится на 4"); default = "odd" }
new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 2; max = 30; step = 1; default = 2 }

string st = "odd"; float n = 2;
string stText = ""; string checkText = ""; string checkCol = "#3b82f6";
string info = "";

Function md(a, b) { return a - floor(a / b) * b; }
Function isPrimeF(v) {
  if (v < 2) { return 0; }
  float ok = 1; float d = 2;
  repeat (40) { if (d * d <= v && ok == 1) { if (md(v, d) == 0) { ok = 0; } } d = d + 1; }
  return ok;
}
Function holds(k, s) {
  if (s == "odd") { if (isPrimeF(k) < 0.5) { return 1; } return md(k, 2); }
  if (s == "sq") { if (md(k, 2) == 0) { return 1; } return isPrimeF(k); }
  if (md(k * k, 4) != 0) { return 1; } return md(k, 4) == 0;
}
Function px(k) { return -8.6 + 17.2 * (k - 1) / 29; }
Function noteText(s) {
  if (s == "odd") { return "n = 2 — контрпример: 2 простое, но чётное. Дальше все простые действительно нечётны, но одного нарушения хватает, чтобы опровергнуть «все»."; }
  if (s == "sq") { return "n = 9 (и 15, 21, 25, …) — контрпример: число нечётное, но составное."; }
  return "n = 2 — контрпример: 4 делится на 4, а само 2 — нет.";
}

Update {
  if (st == "odd") { stText = "«Все простые числа нечётны»"; }
  else if (st == "sq") { stText = "«Все нечётные числа простые»"; }
  else { stText = "«Если n² делится на 4, то n делится на 4»"; }

  gb = newGraph(); gc = newGraph();
  float anyBad = 0;
  repeat (29) {
    float k = i + 2; float ok = holds(k, st);
    string col = "#22c55e"; if (ok < 0.5) { col = "#f59e0b"; anyBad = 1; }
    addNode(gb, "p" + format(k, 0), [px(k), -1.5]); addNode(gb, "q" + format(k, 0), [px(k), -0.6]); addEdge(gb, "p" + format(k, 0), "q" + format(k, 0), 1, col);
  }
  addNode(gc, "cur", [px(n), -0.2]);

  float okN = holds(n, st);
  if (okN < 0.5) { checkText = "контрпример — утверждение здесь неверно"; checkCol = "#f59e0b"; }
  else { checkText = "утверждение здесь верно"; checkCol = "#22c55e"; }

  info = "**Контрпример** опровергает утверждение «для всех объектов класса верно…» — достаточно предъявить один объект, для которого оно нарушается. Красные столбики — те n, где утверждение ложно.\n\n" + noteText(st);
}
]
