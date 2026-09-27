[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 2; float b = 1.5; string info = "";
draw Graph { name = "gb"; graph = "grph"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "a³ + b³"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.5); text = "(a + b)(a² − ab + b²)"; size = 0.75 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = 0.5; max = 3; step = 0.1; default = 1.5 }
Update {
  grph = newGraph();
  float v1 = a * a * a + b * b * b; float v2 = (a + b) * (a * a - a * b + b * b);
  float sc = 6 / 54;
  addNode(grph, "a0", [-3, -3]); addNode(grph, "a1", [-3, -3 + sc * v1]); addEdge(grph, "a0", "a1", 1, "#3b82f6");
  addNode(grph, "b0", [3, -3]); addNode(grph, "b1", [3, -3 + sc * v2]); addEdge(grph, "b0", "b1", 1, "#f59e0b");
  info = "**Сумма кубов:** a³ + b³ = (a + b)(a² − ab + b²).\n\nПри a = " + format(a, 1) + ", b = " + format(b, 1) + ": a³ + b³ = " + format(v1, 2) + " и (a + b)(a² − ab + b²) = " + format(v2, 2) + " — столбики равны при любых a и b.";
}
]
