[
description = "{info}"
field width = 18; field height = 10;
camera type = fixed;
float m5 = 4; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; labels = false; interactive = false }
new UI { type = slider; label = "частота m₅ значения 5"; variable = m5; min = 0; max = 8; step = 1; default = 4 }
Function bar(k, xp, val, sel) { string c = "#3b82f6"; if (sel) { c = "#f59e0b"; } addNode(g, "a"+k, [xp, -4]); addNode(g, "b"+k, [xp, -4 + val * 0.6]); addEdge(g, "a"+k, "b"+k, 1, c); }
Update {
  m5 = round(m5);
  float mx = 2; if (5 > mx) { mx = 5; } if (3 > mx) { mx = 3; } if (5 > mx) { mx = 5; } if (m5 > mx) { mx = m5; }
  g = newGraph();
  bar("1", -8, 2, 2 == mx); bar("2", -4, 5, 5 == mx); bar("3", 0, 3, 3 == mx); bar("4", 4, 5, 5 == mx); bar("5", 8, m5, m5 == mx);
  info = "Частоты значений 1…5: 2, 5, 3, 5, " + format(m5,0) + ".\n\nВыборочная мода — значение(-я) с наибольшей частотой (m = " + format(mx,0) + "), отмечено оранжевым.";
}
]
