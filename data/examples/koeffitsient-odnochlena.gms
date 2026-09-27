[
description = "{info}"
field width = 10; field height = 8;
camera type = fixed;
float k = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 25; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-2.5, -3.7); text = "коэффициент k"; size = 0.75 }
draw Text { name = "l2"; pos = (2.5, -3.7); text = "kx² при x=2"; size = 0.75 }
new UI { type = slider; label = "коэффициент k"; variable = k; min = -5; max = 5; step = 1; default = 3 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  float v = k * 4;
  float h1 = k / 5 * 3; if (h1 > 3) { h1 = 3; } if (h1 < -3) { h1 = -3; }
  float h2 = v / 20 * 3; if (h2 > 3) { h2 = 3; } if (h2 < -3) { h2 = -3; }
  g = newGraph(); addNode(g, "a0", [-2.5, 0]); addNode(g, "a1", [-2.5, h1]); addEdge(g, "a0", "a1", 1, "#3b82f6");
  addNode(g, "b0", [2.5, 0]); addNode(g, "b1", [2.5, h2]); addEdge(g, "b0", "b1", 1, "#f59e0b");
  info = "**Коэффициент** — числовой множитель одночлена kx². При k = " + num(k,0) + " одночлен kx² в точке x = 2 равен " + num(v,0) + ": коэффициент масштабирует значение x² = 4 в " + num(k,0) + " раз.";
}
]
