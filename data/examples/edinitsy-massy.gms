[
description = "{info}"
field width = 12; field height = 6;
camera type = fixed;
float kg = 2.5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; labels = false; interactive = false }
new UI { type = slider; label = "масса, кг"; variable = kg; min = 0.1; max = 5; step = 0.1; default = 2.5 }
Update {
  g = newGraph(); addNode(g, "0", [-5, 0]); addNode(g, "1", [-5 + kg * 1.8, 0]); addEdge(g, "0", "1", 1, "#f59e0b");
  info = "**" + format(kg, 1) + " кг = " + format(kg * 1000, 0) + " г = " + format(kg * 1000000, 0) + " мг = " + format(kg / 1000, 4) + " т** — перевод между единицами массы выполняется умножением или делением на степени десяти.";
}
]
