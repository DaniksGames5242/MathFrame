[
description = "{info}"
field width = 10; field height = 8;
camera type = fixed;
float x = 1; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 25; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-2.5, -3.7); text = "(x+1)²"; size = 0.8 }
draw Text { name = "l2"; pos = (2.5, -3.7); text = "x²+2x+1"; size = 0.75 }
new UI { type = slider; label = "x"; variable = x; min = -4; max = 4; step = 0.5; default = 1 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  float lhs = (x + 1) * (x + 1);
  float rhs = x * x + 2 * x + 1;
  float h = lhs / 25 * 6; if (h > 6) { h = 6; }
  g = newGraph(); addNode(g, "a0", [-2.5, -3]); addNode(g, "a1", [-2.5, -3 + h]); addEdge(g, "a0", "a1", 1, "#3b82f6");
  addNode(g, "b0", [2.5, -3]); addNode(g, "b1", [2.5, -3 + h]); addEdge(g, "b0", "b1", 1, "#f59e0b");
  info = "**Тождество** (x+1)² = x²+2x+1 верно при любом x. При x = " + num(x,1) + " обе части равны " + num(lhs,2) + " — столбики совпадают по высоте.";
}
]
