[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 3; float b = 5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; labels = false; interactive = false }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 5; step = 0.1; default = 3 }
new UI { type = slider; label = "b"; variable = b; min = 0.5; max = 8; step = 0.1; default = 5 }
Update {
  float lhs = sqrt(a * a * b); float rhs = a * sqrt(b);
  float lb = lhs; if (lb > 6) { lb = 6; } float rb = rhs; if (rb > 6) { rb = 6; }
  g = newGraph(); addNode(g, "a0", [-2, -3]); addNode(g, "a1", [-2, -3 + lb]); addEdge(g, "a0", "a1", 1, "#3b82f6");
  addNode(g, "b0", [2, -3]); addNode(g, "b1", [2, -3 + rb]); addEdge(g, "b0", "b1", 1, "#f59e0b");
  info = "**Вынесение множителя из-под знака корня:** √(a² · b) = a · √b, при a ≥ 0, b ≥ 0.\n\nПри a = " + format(a, 1) + ", b = " + format(b, 1) + ": √(a²·b) = " + format(lhs, 3) + " (синий столбик), a·√b = " + format(a, 1) + " · " + format(sqrt(b), 3) + " = " + format(rhs, 3) + " (оранжевый) — равны.";
}
]
