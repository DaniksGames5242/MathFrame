[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Критерий делимости на 3: «сумма цифр n делится на 3» ⇔ «n делится на 3».
// Стороны совпадают для любого n — проверка на всём диапазоне ползунка. ----
draw Text { name = "tn"; pos = (0, 4); text = "n = " + format(n, 0); size = 1.9 }
draw Text { name = "ds"; pos = (0, 2.7); text = "сумма цифр = " + format(s, 0); size = 1.05; }
draw Text { name = "cL"; pos = (-7.4, 0.9); text = "сумма цифр делится на 3"; size = 1.05; align = left }
draw Text { name = "vL"; pos = (7.4, 0.9); text = mark(cond); size = 1.05; align = right; color = colCond }
draw Text { name = "arr"; pos = (0, -0.3); text = "⇔"; size = 1.4; color = #f59e0b }
draw Text { name = "cR"; pos = (-7.4, -1.5); text = "n делится на 3"; size = 1.05; align = left }
draw Text { name = "vR"; pos = (7.4, -1.5); text = mark(concl); size = 1.05; align = right; color = colConcl }
draw Text { name = "note"; pos = (0, -3); text = noteText; size = 1.05; color = #22c55e }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 0; max = 200; step = 1; default = 27 }

float n = 27; float s = 0;
float cond = 0; float concl = 0;
string colCond = "#6b7280"; string colConcl = "#6b7280"; string noteText = "";
string info = "";

Function md(a, b) { return a - floor(a / b) * b; }
Function mark(b) { if (b > 0.5) { return "верно"; } return "неверно"; }

Update {
  s = 0; float m = n; repeat (8) { if (m > 0) { s = s + md(m, 10); m = floor(m / 10); } }
  cond = 0; if (md(s, 3) == 0) { cond = 1; }
  concl = 0; if (md(n, 3) == 0) { concl = 1; }
  colCond = "#6b7280"; if (cond > 0.5) { colCond = "#3b82f6"; }
  colConcl = "#6b7280"; if (concl > 0.5) { colConcl = "#3b82f6"; }
  if (cond == concl) { noteText = "стороны совпадают — так для любого n, это и есть критерий"; }
  else { noteText = "если здесь стороны разошлись — это баг, а не критерий"; }

  info = "**Необходимое и достаточное условие (критерий):** «сумма цифр n делится на 3» ⇔ «n делится на 3». Обе стороны истинны или ложны одновременно при любом n — двусторонняя связь заменяет одно утверждение другим без потери истинности, в отличие от одностороннего признака.\n\nn = " + format(n, 0) + ", сумма цифр = " + format(s, 0) + ": условие — " + mark(cond) + ", заключение — " + mark(concl) + ".";
}
]
