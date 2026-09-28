[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Признак — импликация «условие ⇒ заключение», связывающая проверяемое свойство
// с принадлежностью к классу. Три вида различаются направлением стрелки: достаточный
// (условие ⇒ заключение), необходимый (заключение ⇒ условие), критерий (⇔). ----
draw Text { name = "tn"; pos = (0, 4); text = "n = " + format(n, 0); size = 1.8 }
draw Text { name = "tCond"; pos = (-7.4, 1.6); text = condText; size = 1.05; align = left }
draw Text { name = "tCondV"; pos = (7.4, 1.6); text = mark(cond); size = 1.05; align = right; color = cCond }
draw Text { name = "tArr"; pos = (0, 0.4); text = arrText; size = 1.3; color = #f59e0b }
draw Text { name = "tConcl"; pos = (-7.4, -0.9); text = conclText; size = 1.05; align = left }
draw Text { name = "tConclV"; pos = (7.4, -0.9); text = mark(concl); size = 1.05; align = right; color = cConcl }
draw Text { name = "tCheck"; pos = (0, -2.4); text = checkText; size = 1.05; color = cCheck }

new UI { name = "sK"; type = select; label = "вид признака"; variable = kind; options = ("suf", "nec", "crit"); labels = ("достаточный", "необходимый", "критерий"); default = "suf" }
new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 1; max = 40; step = 1; default = 8 }

string kind = "suf"; float n = 8;
float cond = 0; float concl = 0;
string condText = ""; string conclText = ""; string arrText = "";
string cCond = "#6b7280"; string cConcl = "#6b7280"; string cCheck = "#6b7280"; string checkText = "";
string info = "";

Function md(a, b) { return a - floor(a / b) * b; }
Function mark(b) { if (b > 0.5) { return "верно"; } return "неверно"; }
Function isPrimeF(v) {
  if (v < 2) { return 0; }
  float ok = 1; float d = 2;
  repeat (40) { if (d * d <= v && ok == 1) { if (md(v, d) == 0) { ok = 0; } } d = d + 1; }
  return ok;
}

Update {
  if (kind == "suf") {
    condText = "n делится на 4"; conclText = "n делится на 2"; arrText = "⇒";
    cond = 0; if (md(n, 4) == 0) { cond = 1; }
    concl = 0; if (md(n, 2) == 0) { concl = 1; }
  } else if (kind == "nec") {
    condText = "n нечётное"; conclText = "n простое и n > 2"; arrText = "⇐";
    concl = 0; if (isPrimeF(n) > 0.5 && n > 2) { concl = 1; }
    cond = 0; if (md(n, 2) == 1) { cond = 1; }
  } else {
    condText = "сумма цифр n делится на 3"; conclText = "n делится на 3"; arrText = "⇔";
    float s = 0; float m = n; repeat (6) { if (m > 0) { s = s + md(m, 10); m = floor(m / 10); } }
    cond = 0; if (md(s, 3) == 0) { cond = 1; }
    concl = 0; if (md(n, 3) == 0) { concl = 1; }
  }
  cCond = "#6b7280"; if (cond > 0.5) { cCond = "#3b82f6"; }
  cConcl = "#6b7280"; if (concl > 0.5) { cConcl = "#3b82f6"; }

  if (kind == "suf") {
    if (cond > 0.5) { checkText = "условие выполнено — заключение обязано быть верным"; cCheck = "#22c55e"; }
    else if (concl > 0.5) { checkText = "заключение верно и без условия — это лишь один из достаточных путей"; cCheck = "#6b7280"; }
    else { checkText = "ни условие, ни заключение не выполнены"; cCheck = "#6b7280"; }
  } else if (kind == "nec") {
    if (concl > 0.5) { checkText = "заключение выполнено — условие обязано быть верным"; cCheck = "#22c55e"; }
    else if (cond > 0.5) { checkText = "условие верно, но заключения нет — оно не гарантирует его"; cCheck = "#6b7280"; }
    else { checkText = "ни условие, ни заключение не выполнены"; cCheck = "#6b7280"; }
  } else {
    checkText = "стороны совпадают всегда — это критерий"; cCheck = "#22c55e";
  }

  info = "**Признак** — утверждение вида «если условие, то заключение», по которому судят о принадлежности объекта к классу. Направление стрелки определяет вид: достаточный признак (условие ⇒ заключение) позволяет утверждать, необходимый (заключение ⇒ условие) — только отрицать, а критерий (⇔) — и то, и другое.\n\nn = " + format(n, 0) + ": «" + condText + "» — " + mark(cond) + ", «" + conclText + "» — " + mark(concl) + ".";
}
]
