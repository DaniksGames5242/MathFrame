[
description = "{info}"
field width = 14; field height = 8;
camera type = fixed;
float day = 15; float month = 6; float year = 2026; string info = ""; float h = 0;
draw Graph { name = "gw"; graph = "g"; nodeRadius = 0; edgeWidth = 26; labels = false; interactive = false }
new UI { type = slider; label = "день"; variable = day; min = 1; max = 28; step = 1; default = 15 }
new UI { type = slider; label = "месяц"; variable = month; min = 1; max = 12; step = 1; default = 6 }
new UI { type = slider; label = "год"; variable = year; min = 1900; max = 2200; step = 1; default = 2026 }
Function bar(k, xp, c) { addNode(g, k + "0", [xp, -1.5]); addNode(g, k + "1", [xp, 1.5]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float mm = month; float yy = year; if (mm <= 2) { mm = mm + 12; yy = yy - 1; }
  float K = yy - 100 * floor(yy / 100); float J = floor(yy / 100);
  float hh = day + floor(13 * (mm + 1) / 5) + K + floor(K / 4) + floor(J / 4) + 5 * J;
  h = hh - 7 * floor(hh / 7);
  g = newGraph();
  repeat (7) { string c = "#3b82f6"; if (i == h) { c = "#f59e0b"; } bar("d" + format(i, 0), -6 + 2 * i, c); }
  string name = "Субботу"; if (h == 1) { name = "Воскресенье"; } if (h == 2) { name = "Понедельник"; } if (h == 3) { name = "Вторник"; } if (h == 4) { name = "Среду"; } if (h == 5) { name = "Четверг"; } if (h == 6) { name = "Пятницу"; }
  info = "**День недели по дате** вычисляется формулой Целлера: " + format(day, 0) + "." + format(month, 0) + "." + format(year, 0) + " приходится на **" + name + "**.";
}
]
