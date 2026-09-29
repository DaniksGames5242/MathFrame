[
description = "{info}"

field width = 16;
field height = 8;
camera type = fixed;

// ---- Схема к задаче «вместе S, одно больше другого на d»: первый отрезок — меньшее, второй — большее
// (синяя часть равна меньшему, оранжевая — разности d). Числа подобраны так, что решение — в целых. ----
draw Graph { name = "gB"; graph = "gb"; edgeWidth = 44; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "l1"; pos = (-7.7, 1.6); text = "меньшее"; size = 1; align = left }
draw Text { name = "l2"; pos = (-7.7, -0.6); text = "большее"; size = 1; align = left }
draw Text { name = "v1"; pos = (-3.6 + 0.35 * m, 1.6); text = "?"; size = 1.1; align = left }
draw Text { name = "v2"; pos = (-3.6 + 0.35 * (m + d), -0.6); text = "?"; size = 1.1; align = left }
draw Text { name = "vS"; pos = (-3.6, -2.6); text = "вместе " + format(2 * m + d, 0); size = 1; align = left }

new UI { type = slider; label = "загаданное меньшее"; variable = m; min = 1; max = 15; step = 1; default = 7 }
new UI { type = slider; label = "разность d"; variable = d; min = 1; max = 10; step = 1; default = 4 }

// ---- Логика ----
float m = 7; float d = 4; string info = "";
Function fs(v) { return format(v, 0); }

Update {
  gb = newGraph();
  addNode(gb, "a0", [-3.6, 1.6]); addNode(gb, "a1", [-3.6 + 0.35 * m, 1.6]); addEdge(gb, "a0", "a1", 1, "#3b82f6");
  addNode(gb, "b0", [-3.6, -0.6]); addNode(gb, "b1", [-3.6 + 0.35 * m, -0.6]); addEdge(gb, "b0", "b1", 1, "#3b82f6");
  addNode(gb, "c0", [-3.6 + 0.35 * m, -0.6]); addNode(gb, "c1", [-3.6 + 0.35 * (m + d), -0.6]); addEdge(gb, "c0", "c1", 1, "#f59e0b");
  float S = 2 * m + d;
  info = "**Задача.** В двух корзинах вместе " + fs(S) + " яблок, причём в одной на " + fs(d) + " больше, чем в другой. Сколько яблок в каждой?\n\n";
  info = info + "**Арифметический способ** — без буквы и уравнения, каждое действие с конкретными числами и со своим смыслом:\n\n";
  info = info + "1) " + fs(S) + " − " + fs(d) + " = " + fs(S - d) + " — столько яблок было бы, если бы в большей корзине не было лишних " + fs(d) + " (в обеих поровну).\n\n";
  info = info + "2) " + fs(S - d) + " : 2 = **" + fs(m) + "** — в меньшей корзине.\n\n";
  info = info + "3) " + fs(m) + " + " + fs(d) + " = **" + fs(m + d) + "** — в большей корзине.\n\n";
  info = info + "Проверка: " + fs(m) + " + " + fs(m + d) + " = " + fs(S) + ".";
}
]
