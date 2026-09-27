[
description = "{info}"
field width = 14; field height = 6;
camera type = fixed;
float year = 2024; string info = ""; float leap = 0;
draw Graph { name = "gd"; graph = "g"; nodeRadius = 5; edgeWidth = 0; labels = false; interactive = false; nodeColor = #3b82f6 }
new Point { name = "P29"; pos = (6.4, 0); dynamic = false; collision = false; color = #f59e0b; active = leap > 0.5 }
new UI { type = slider; label = "год"; variable = year; min = 1; max = 3000; step = 1; default = 2024 }
Update {
  float m4 = year - 4 * floor(year / 4); float m100 = year - 100 * floor(year / 100); float m400 = year - 400 * floor(year / 400);
  leap = 0; if (m4 == 0) { if (m100 != 0) { leap = 1; } } if (m400 == 0) { leap = 1; }
  g = newGraph(); repeat (28) { addNode(g, "d" + format(i, 0), [-6.6 + 0.48 * i, 0]); }
  string s = "не високосный (28 дней в феврале)"; if (leap > 0.5) { s = "**високосный** (29 дней в феврале)"; }
  string d4 = "нет"; if (m4 == 0) { d4 = "да"; }
  string d100 = "нет"; if (m100 == 0) { d100 = "да"; }
  string d400 = "нет"; if (m400 == 0) { d400 = "да"; }
  info = "Год " + format(year, 0) + " — " + s + ". Делится на 4: " + d4 + "; на 100: " + d100 + "; на 400: " + d400 + ".";
}
]
