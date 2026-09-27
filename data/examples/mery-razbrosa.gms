[
description = "{info}"
field width = 18; field height = 10;
camera type = fixed;
float x5 = 5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; labels = false; interactive = false }
new UI { type = slider; label = "x₅"; variable = x5; min = 1; max = 10; step = 0.5; default = 5 }
Function bar(k, xp, val) { addNode(g, "a"+k, [xp, -4]); addNode(g, "b"+k, [xp, -4 + val * 0.6]); addEdge(g, "a"+k, "b"+k, 1, "#3b82f6"); }
Update {
  g = newGraph();
  bar("1", -8, 4); bar("2", -4, 7); bar("3", 0, 2); bar("4", 4, 6); bar("5", 8, x5);
  float mn = 4; if (7 < mn) { mn = 7; } if (2 < mn) { mn = 2; } if (6 < mn) { mn = 6; } if (x5 < mn) { mn = x5; }
  float mx = 4; if (7 > mx) { mx = 7; } if (2 > mx) { mx = 2; } if (6 > mx) { mx = 6; } if (x5 > mx) { mx = x5; }
  float mean = (4 + 7 + 2 + 6 + x5) / 5;
  float disp = ((4-mean)*(4-mean) + (7-mean)*(7-mean) + (2-mean)*(2-mean) + (6-mean)*(6-mean) + (x5-mean)*(x5-mean)) / 5;
  info = "Выборка: 4, 7, 2, 6, " + format(x5,1) + ".\n\nРазмах R = xmax − xmin = " + format(mx,1) + " − " + format(mn,1) + " = **" + format(mx-mn,1) + "**.\n\nВыборочная дисперсия D = **" + format(disp,2) + "**.";
}
]
