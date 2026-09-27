[
description = "{info}"
field width = 10; field height = 8;
camera type = fixed;
float x = 3; string info = ""; float VMAX = 8;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; labels = false; interactive = false }
new UI { type = slider; label = "x"; variable = x; min = 0.5; max = 6; step = 0.1; default = 3 }
Update {
  float A = x; float B = x + 2; float C = 3; float D = x;
  float lhs = (A / B) / (C / D); float rhs = (A * D) / (B * C);
  g = newGraph();
  addNode(g, "a0", [-2, -3]); addNode(g, "a1", [-2, -3 + 6 * lhs / VMAX]); addEdge(g, "a0", "a1", 1, "#3b82f6");
  addNode(g, "b0", [2, -3]); addNode(g, "b1", [2, -3 + 6 * rhs / VMAX]); addEdge(g, "b0", "b1", 1, "#f59e0b");
  info = "**Деление алгебраических дробей:** x/(x + 2) : 3/x = x/(x + 2) · x/3 = x²/(3(x + 2)).\n\nПри x = " + format(x, 2) + ": левая часть = " + format(lhs, 3) + " (синий столбик), правая часть x²/(3(x+2)) = " + format(rhs, 3) + " (оранжевый) — равны.";
}
]
