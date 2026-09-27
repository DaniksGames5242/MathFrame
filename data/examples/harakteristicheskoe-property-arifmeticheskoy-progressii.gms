[
description = "{info}"
field width = 18; field height = 8;
camera type = fixed;
float a = 1; float d = 1; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 6; edgeWidth = 4; labels = true; interactive = false }
new UI { type = slider; label = "a₁"; variable = a; min = -4; max = 4; step = 0.5; default = 1 }
new UI { type = slider; label = "d"; variable = d; min = -2; max = 2; step = 0.5; default = 1 }
Function num(v, d2) { if (v < 0) { return "−" + format(-v, d2); } return format(v, d2); }
Update {
  float sc = 0.8;
  g = newGraph();
  addNode(g, "n1", [sc * a, 0], "a₁"); addNode(g, "n2", [sc * (a + d), 0], "a₂"); addNode(g, "n3", [sc * (a + 2 * d), 0], "a₃");
  addEdge(g, "n1", "n2", 1, "#3b82f6"); addEdge(g, "n2", "n3", 1, "#f59e0b");
  info = "**Характеристическое свойство арифметической прогрессии:** aₙ₊₁ − aₙ = aₙ₊₂ − aₙ₊₁ — разность между соседними членами постоянна и равна d.\n\nПри a₁ = " + num(a, 1) + ", d = " + num(d, 1) + ": a₁ = " + num(a, 1) + ", a₂ = " + num(a + d, 1) + ", a₃ = " + num(a + 2 * d, 1) + " — синий и оранжевый отрезки равной длины " + format(abs(d), 1) + ".";
}
]
