[
description = "{info}"
field width = 12; field height = 6;
camera type = fixed;
float x = -2; string info = "";
draw Graph { name = "ax"; graph = "gax"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
new Point { name = "P1"; pos = (0, 1); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "P2"; pos = (0, -1); dynamic = false; collision = false; color = #f59e0b }
draw Text { name = "l1"; pos = (0, 2); text = "x = " + format(x, 1); size = 0.9 }
draw Text { name = "l2"; pos = (0, -2); text = "√(x²) = |x| = " + format(abs(x), 1); size = 0.9 }
new UI { type = slider; label = "x"; variable = x; min = -5; max = 5; step = 0.1; default = -2 }
Update {
  gax = newGraph(); addNode(gax, "a1", [-5.5, 0]); addNode(gax, "a2", [5.5, 0]); addEdge(gax, "a1", "a2");
  P1.pos.x = x; P2.pos.x = abs(x);
  info = "**√(x²) = |x|** для любого действительного x. При x = " + format(x, 1) + ": x² = " + format(x * x, 1) + ", √(x²) = " + format(abs(x), 1) + " = |x|.";
}
]
