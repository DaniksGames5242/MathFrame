[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Достаточное условие: «n делится на 4» ⇒ «n делится на 2» — если условие
// выполнено, заключение гарантировано, но заключение бывает верным и без него
// (n делится на 2, но не на 4). Второй, независимый достаточный путь к тому же
// заключению — «n делится на 6». ----
draw Text { name = "tn"; pos = (0, 4); text = "n = " + format(n, 0); size = 1.8 }
draw Text { name = "c1"; pos = (-7.4, 2); text = "n делится на 4"; size = 1.05; align = left }
draw Text { name = "v1"; pos = (7.4, 2); text = mark(c1); size = 1.05; align = right; color = col1 }
draw Text { name = "c2"; pos = (-7.4, 0.9); text = "n делится на 6"; size = 1.05; align = left }
draw Text { name = "v2"; pos = (7.4, 0.9); text = mark(c2); size = 1.05; align = right; color = col2 }
draw Text { name = "arr"; pos = (0, -0.2); text = "⇒"; size = 1.3; color = #f59e0b }
draw Text { name = "cc"; pos = (-7.4, -1.3); text = "n делится на 2"; size = 1.05; align = left }
draw Text { name = "vc"; pos = (7.4, -1.3); text = mark(c3); size = 1.05; align = right; color = col3 }
draw Text { name = "note"; pos = (0, -2.8); text = noteText; size = 1; color = noteCol }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 0; max = 48; step = 1; default = 8 }

float n = 8;
float c1 = 0; float c2 = 0; float c3 = 0;
string col1 = "#3b82f6"; string col2 = "#3b82f6"; string col3 = "#3b82f6";
string noteText = ""; string noteCol = "#3b82f6";
string info = "";

Function md(a, b) { return a - floor(a / b) * b; }
Function mark(b) { if (b > 0.5) { return "верно"; } return "неверно"; }

Update {
  c1 = 0; if (md(n, 4) == 0) { c1 = 1; }
  c2 = 0; if (md(n, 6) == 0) { c2 = 1; }
  c3 = 0; if (md(n, 2) == 0) { c3 = 1; }
  col1 = "#3b82f6"; if (c1 > 0.5) { col1 = "#3b82f6"; }
  col2 = "#3b82f6"; if (c2 > 0.5) { col2 = "#3b82f6"; }
  col3 = "#3b82f6"; if (c3 > 0.5) { col3 = "#3b82f6"; }

  if (c1 > 0.5 || c2 > 0.5) {
    noteText = "хотя бы одно достаточное условие выполнено — заключение гарантировано"; noteCol = "#22c55e";
  } else if (c3 > 0.5) {
    noteText = "ни одно из двух условий не выполнено, а заключение всё же верно — оно не единственный путь"; noteCol = "#3b82f6";
  } else {
    noteText = "ни условия, ни заключения нет"; noteCol = "#3b82f6";
  }

  info = "**Достаточное условие:** из «n делится на 4» следует «n делится на 2» — но не наоборот. Заключение может быть верным и без этого условия, например через другое, независимое достаточное условие («n делится на 6»), или вовсе по иной причине.\n\nn = " + format(n, 0) + ": «делится на 4» — " + mark(c1) + ", «делится на 6» — " + mark(c2) + ", «делится на 2» — " + mark(c3) + ".";
}
]
