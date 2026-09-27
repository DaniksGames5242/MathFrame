[
description = "{info}"
field width = 20; field height = 10;
camera type = fixed;
float x = 4; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 4; edgeCap = butt; labels = false; interactive = false; color = #3b82f6 }
new Point { name = "P"; pos = (4, -4.6); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "x"; variable = x; min = -9; max = 9; step = 0.5; default = 4 }
Function seg(k, x1, x2, h) { addNode(g, "a"+k, [x1, -4 + h * 6]); addNode(g, "b"+k, [x2, -4 + h * 6]); addEdge(g, "a"+k, "b"+k); }
Update {
  g = newGraph();
  seg("0", -10, 1, 0); seg("1", 1, 3, 0.2); seg("2", 3, 6, 0.6); seg("3", 6, 8, 0.8); seg("4", 8, 10, 1);
  P.pos.x = x;
  float F = 0; if (x >= 1) { F = 0.2; } if (x >= 3) { F = 0.6; } if (x >= 6) { F = 0.8; } if (x >= 8) { F = 1; }
  info = "Выборка (n = 5): 1, 3, 3, 6, 8.\n\nЭмпирическая функция распределения F(x) — доля значений выборки, не превышающих x. При x = " + format(x,1) + " F(x) = **" + format(F,1) + "**.";
}
]
