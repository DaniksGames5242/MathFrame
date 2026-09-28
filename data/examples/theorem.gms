[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Для n = 1…12 проверяем условие A(n) и заключение B(n) выбранной теоремы:
// «если A(n), то B(n)». Зелёный кружок — A(n) истинно, оранжевый — B(n) истинно. ----
draw Text { name = "hA"; pos = (-7.3, 2.6); text = "A(n)"; size = 0.9; align = left }
draw Text { name = "hB"; pos = (-7.3, 0.6); text = "B(n)"; size = 0.9; align = left }
draw Graph { name = "gA"; graph = "ga"; nodeColor = #22c55e; nodeRadius = 12; labels = false; interactive = false; showWeights = false }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #f59e0b; nodeRadius = 12; labels = false; interactive = false; showWeights = false }
draw Text { name = "n1"; pos = (nx(0), -1.4); text = "1"; size = 0.8; color = #3b82f6 }
draw Text { name = "n2"; pos = (nx(1), -1.4); text = "2"; size = 0.8; color = #3b82f6 }
draw Text { name = "n3"; pos = (nx(2), -1.4); text = "3"; size = 0.8; color = #3b82f6 }
draw Text { name = "n4"; pos = (nx(3), -1.4); text = "4"; size = 0.8; color = #3b82f6 }
draw Text { name = "n5"; pos = (nx(4), -1.4); text = "5"; size = 0.8; color = #3b82f6 }
draw Text { name = "n6"; pos = (nx(5), -1.4); text = "6"; size = 0.8; color = #3b82f6 }
draw Text { name = "n7"; pos = (nx(6), -1.4); text = "7"; size = 0.8; color = #3b82f6 }
draw Text { name = "n8"; pos = (nx(7), -1.4); text = "8"; size = 0.8; color = #3b82f6 }
draw Text { name = "n9"; pos = (nx(8), -1.4); text = "9"; size = 0.8; color = #3b82f6 }
draw Text { name = "n10"; pos = (nx(9), -1.4); text = "10"; size = 0.8; color = #3b82f6 }
draw Text { name = "n11"; pos = (nx(10), -1.4); text = "11"; size = 0.8; color = #3b82f6 }
draw Text { name = "n12"; pos = (nx(11), -1.4); text = "12"; size = 0.8; color = #3b82f6 }

new UI { name = "sT"; type = select; label = "теорема"; variable = sr; options = ("div4", "div6", "gt6"); labels = ("делится на 4 ⇒ делится на 2", "делится на 6 ⇔ на 2 и на 3", "n > 6 ⇒ n ≥ 5"); default = "div4" }

// ---- Логика ----
string sr = "div4";
float ceDirect = 0; float ceConverse = 0;
string info = "";

Function md(a, b) { return a - floor(a / b) * b; }
Function nx(i) { return -7 + i * 1.35; }
Function Aof(n) { if (sr == "div4") { return md(n, 4) == 0; } if (sr == "div6") { return md(n, 6) == 0; } return n > 6; }
Function Bof(n) { if (sr == "div4") { return md(n, 2) == 0; } if (sr == "div6") { return md(n, 2) == 0 && md(n, 3) == 0; } return n >= 5; }

Update {
  ga = newGraph(); gb = newGraph();
  ceDirect = 0; ceConverse = 0;
  repeat (12) {
    float n = i + 1;
    if (Aof(n)) { addNode(ga, "a" + format(n, 0), [nx(i), 2.6]); if (!Bof(n) && ceDirect == 0) { ceDirect = n; } }
    if (Bof(n)) { addNode(gb, "b" + format(n, 0), [nx(i), 0.6]); if (!Aof(n) && ceConverse == 0) { ceConverse = n; } }
  }

  string aTxt = "n делится на 4"; string bTxt = "n делится на 2";
  if (sr == "div6") { aTxt = "n делится на 6"; bTxt = "n делится на 2 и на 3"; }
  if (sr == "gt6") { aTxt = "n > 6"; bTxt = "n ≥ 5"; }

  info = "**Теорема** — утверждение «если A(n), то B(n)», доказанное для всех n из рассматриваемого множества. Условие: A(n) = «" + aTxt + "». Заключение: B(n) = «" + bTxt + "».\n\n";
  if (ceDirect == 0) { info = info + "**Прямая теорема верна:** для всех n = 1…12, где выполнено A(n), выполнено и B(n) — значит, A(n) **достаточно** для B(n)."; }
  else { info = info + "Прямая теорема здесь **неверна**: при n = " + format(ceDirect, 0) + " A(n) истинно, а B(n) — нет."; }
  if (ceConverse == 0) { info = info + " Обратная теорема тоже верна: A(n) **необходимо** для B(n). Значит, A и B — **критерий** друг для друга (A(n) ⇔ B(n))."; }
  else { info = info + " Обратная теорема **неверна**: контрпример n = " + format(ceConverse, 0) + " — B(n) истинно, а A(n) — нет, так что A(n) не является необходимым для B(n)."; }
  info = info + " Противоположная теорема (¬B ⇒ ¬A) равносильна прямой и потому верна ровно тогда же, когда и прямая.";
}
]
