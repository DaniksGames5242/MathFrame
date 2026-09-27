[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 3; float b = -1; string info = "";
draw Graph { name = "gb"; graph = "grph"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "(a − b)²"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.5); text = "a² − 2ab + b²"; size = 0.8 }
new UI { type = slider; label = "a"; variable = a; min = -4; max = 4; step = 0.1; default = 3 }
new UI { type = slider; label = "b"; variable = b; min = -4; max = 4; step = 0.1; default = -1 }
Update {
  grph = newGraph();
  float v1 = (a - b) * (a - b); float v2 = a * a - 2 * a * b + b * b;
  float sc = 6 / 64;
  addNode(grph, "a0", [-3, -3]); addNode(grph, "a1", [-3, -3 + sc * v1]); addEdge(grph, "a0", "a1", 1, "#3b82f6");
  addNode(grph, "b0", [3, -3]); addNode(grph, "b1", [3, -3 + sc * v2]); addEdge(grph, "b0", "b1", 1, "#f59e0b");
  info = "**Квадрат разности:** (a − b)² = a² − 2ab + b².\n\nПри a = " + format(a, 1) + ", b = " + format(b, 1) + ": (a − b)² = " + format(v1, 2) + " и a² − 2ab + b² = " + format(v2, 2) + " — совпадают при любых a и b.";
}
]
