[
description = "{info}"
field width = 14; field height = 8;
camera type = fixed;
float a = 2; float b = 3; float c = 7; string info = "";
draw Graph { name = "ax1"; graph = "g1"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
draw Graph { name = "ax2"; graph = "g2"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
new Point { name = "P1"; pos = (0, 2); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "P2"; pos = (0, -2); dynamic = false; collision = false; color = #f59e0b }
draw Text { name = "l1"; pos = (0, 3); text = "ax + b = c"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -1); text = "ax = c − b"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = -5; max = 5; step = 0.1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = -6; max = 6; step = 0.1; default = 3 }
new UI { type = slider; label = "c"; variable = c; min = -6; max = 6; step = 0.1; default = 7 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a) < 0.05) { a = 0.1; }
  g1 = newGraph(); addNode(g1, "m1", [-6.5, 2]); addNode(g1, "m2", [6.5, 2]); addEdge(g1, "m1", "m2");
  g2 = newGraph(); addNode(g2, "n1", [-6.5, -2]); addNode(g2, "n2", [6.5, -2]); addEdge(g2, "n1", "n2");
  float x = (c - b) / a; P1.pos.x = x; P2.pos.x = x;
  info = "Уравнение ax + b = c и равносильное ему ax = c − b (перенос b в другую часть) имеют одно и то же множество решений — при a = " + format(a, 1) + ", b = " + format(b, 1) + ", c = " + format(c, 1) + " оба дают корень x = " + num(x, 2) + ", точки совпадают.";
}
]
