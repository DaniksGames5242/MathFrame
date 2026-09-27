[
description = "{info}"
field width = 18; field height = 10;
camera type = fixed;
float x5 = 5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; labels = false; interactive = false }
new UI { type = slider; label = "x₅"; variable = x5; min = 1; max = 10; step = 1; default = 5 }
Function bar(k, x, val) { addNode(g, "a"+k, [x, -4]); addNode(g, "b"+k, [x, -4 + val * 0.7]); addEdge(g, "a"+k, "b"+k, 1, "#3b82f6"); }
Update {
  float a = 4; float b = 7; float c = 2; float d = 6; float e = x5; float t = 0;
  if (a > b) { t = a; a = b; b = t; } if (b > c) { t = b; b = c; c = t; } if (c > d) { t = c; c = d; d = t; } if (d > e) { t = d; d = e; e = t; }
  if (a > b) { t = a; a = b; b = t; } if (b > c) { t = b; b = c; c = t; } if (c > d) { t = c; c = d; d = t; }
  if (a > b) { t = a; a = b; b = t; } if (b > c) { t = b; b = c; c = t; }
  if (a > b) { t = a; a = b; b = t; }
  g = newGraph();
  bar("1", -8, a); bar("2", -4, b); bar("3", 0, c); bar("4", 4, d); bar("5", 8, e);
  info = "Исходная выборка: 4, 7, 2, 6, " + format(x5,0) + ".\n\nВариационный ряд (по возрастанию): " + format(a,0) + " ≤ " + format(b,0) + " ≤ " + format(c,0) + " ≤ " + format(d,0) + " ≤ " + format(e,0) + ".";
}
]
