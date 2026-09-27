[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Числа 1…60. Свойство P — «что хотим», условие Q — «что проверяем».
// Зелёные — есть и P, и Q; красные — P без Q (из-за них Q не необходимо для P);
// оранжевые — Q без P (из-за них Q не достаточно для P); серые — ни того, ни другого. ----
draw Graph { name = "gB"; graph = "gbo"; nodeColor = #22c55e; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gP"; graph = "gpo"; nodeColor = #ef4444; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gQ"; graph = "gqo"; nodeColor = #f59e0b; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gN"; graph = "gno"; nodeColor = #6b7280; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "tv"; pos = (0, 4.3); text = verdict; size = 1.2; color = vcol }

new UI { name = "sP"; type = select; label = "P"; variable = P; options = ("d2", "d3", "d4", "d6", "d12", "s3", "pr", "odd", "e0", "d10", "d5"); labels = ("делится на 2", "делится на 3", "делится на 4", "делится на 6", "делится на 12", "сумма цифр делится на 3", "простое", "нечётное", "оканчивается на 0", "делится на 10", "делится на 5"); default = "d6" }
new UI { name = "sQ"; type = select; label = "Q"; variable = Q; options = ("d2", "d3", "d4", "d6", "d12", "s3", "pr", "odd", "e0", "d10", "d5"); labels = ("делится на 2", "делится на 3", "делится на 4", "делится на 6", "делится на 12", "сумма цифр делится на 3", "простое", "нечётное", "оканчивается на 0", "делится на 10", "делится на 5"); default = "d2" }

// ---- Логика ----
string P = "d6"; string Q = "d2";
string verdict = ""; string vcol = "#22c55e";
string info = "";

Function md(a, b) { return a - floor(a / b) * b; }
Function isPr(n) { if (n < 2) { return false; } float ok = 1; repeat (8) { float d = i + 2; if (d * d <= n && md(n, d) == 0) { ok = 0; } } return ok == 1; }
Function has(pp, n) {
  if (pp == "d2") { return md(n, 2) == 0; } if (pp == "d3") { return md(n, 3) == 0; } if (pp == "d4") { return md(n, 4) == 0; }
  if (pp == "d6") { return md(n, 6) == 0; } if (pp == "d12") { return md(n, 12) == 0; } if (pp == "s3") { return md(floor(n / 10) + md(n, 10), 3) == 0; }
  if (pp == "pr") { return isPr(n); } if (pp == "odd") { return md(n, 2) == 1; } if (pp == "e0") { return md(n, 10) == 0; }
  if (pp == "d10") { return md(n, 10) == 0; } return md(n, 5) == 0;
}
Function nm(pp) {
  if (pp == "d2") { return "делится на 2"; }
  if (pp == "d3") { return "делится на 3"; }
  if (pp == "d4") { return "делится на 4"; }
  if (pp == "d6") { return "делится на 6"; }
  if (pp == "d12") { return "делится на 12"; }
  if (pp == "s3") { return "сумма цифр делится на 3"; }
  if (pp == "pr") { return "простое"; }
  if (pp == "odd") { return "нечётное"; }
  if (pp == "e0") { return "оканчивается на 0"; }
  if (pp == "d10") { return "делится на 10"; }
  if (pp == "d5") { return "делится на 5"; }
  return "";
}

Update {
  gbo = newGraph(); gpo = newGraph(); gqo = newGraph(); gno = newGraph();
  float cP = 0; float cQ = 0; string exP = ""; string exQ = "";
  repeat (60) { float n = i + 1;
    float x = -6.75 + 1.5 * md(i, 10); float y = 2.9 - 1.3 * floor(i / 10);
    string k = format(n, 0);
    float a = 0; float b = 0; if (has(P, n)) { a = 1; } if (has(Q, n)) { b = 1; }
    if (a == 1 && b == 1) { addNode(gbo, k, [x, y]); }
    if (a == 1 && b == 0) { addNode(gpo, k, [x, y]); cP = cP + 1; if (exP == "") { exP = k; } }
    if (a == 0 && b == 1) { addNode(gqo, k, [x, y]); cQ = cQ + 1; if (exQ == "") { exQ = k; } }
    if (a == 0 && b == 0) { addNode(gno, k, [x, y]); }
  }
  if (cP == 0 && cQ == 0) { verdict = "Q необходимо и достаточно для P  (P ⇔ Q)"; vcol = "#22c55e"; }
  if (cP == 0 && cQ > 0) { verdict = "Q необходимо, но не достаточно для P  (P ⇒ Q)"; vcol = "#3b82f6"; }
  if (cP > 0 && cQ == 0) { verdict = "Q достаточно, но не необходимо для P  (Q ⇒ P)"; vcol = "#3b82f6"; }
  if (cP > 0 && cQ > 0) { verdict = "Q ни необходимо, ни достаточно для P"; vcol = "#f59e0b"; }

  info = "**Необходимое условие:** Q необходимо для P, если P ⇒ Q — без Q свойства P не бывает, но одного Q мало. **Достаточное:** Q достаточно для P, если Q ⇒ P. Если выполнено и то и другое, Q — **критерий** (необходимое и достаточное условие): P ⇔ Q. На языке множеств: Q необходимо ⇔ множество P лежит внутри множества Q; достаточно ⇔ Q лежит внутри P.\n\nP — «" + nm(P) + "», Q — «" + nm(Q) + "».  ";
  if (cP > 0) { info = info + "Q **не необходимо**: число " + exP + " обладает P, но не Q (красные — все такие).  "; } else { info = info + "Q **необходимо**: все числа со свойством P обладают и Q (красных нет).  "; }
  if (cQ > 0) { info = info + "Q **не достаточно**: число " + exQ + " обладает Q, но не P (оранжевые)."; } else { info = info + "Q **достаточно**: всё, что обладает Q, обладает и P (оранжевых нет)."; }
}
]
