[
description = "{info}"
field width = 12; field height = 6;
camera type = fixed;
float m = 2.5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; labels = false; interactive = false }
new UI { type = slider; label = "длина, м"; variable = m; min = 0.1; max = 5; step = 0.1; default = 2.5 }
Update {
  g = newGraph(); addNode(g, "0", [-5, 0]); addNode(g, "1", [-5 + m * 1.8, 0]); addEdge(g, "0", "1", 1, "#3b82f6");
  info = "**" + format(m, 1) + " м = " + format(m * 100, 0) + " см = " + format(m * 1000, 0) + " мм = " + format(m / 1000, 4) + " км** — перевод между единицами длины выполняется умножением или делением на степени десяти.";
}
]
