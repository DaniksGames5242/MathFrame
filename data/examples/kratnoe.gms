[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float b = 4; float k = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 26; interactive = false; labels = false }
new UI { type = slider; label = "число b"; variable = b; min = 2; max = 12; step = 1; default = 4 }
new UI { type = slider; label = "коэффициент k"; variable = k; min = 1; max = 12; step = 1; default = 3 }
Update {
  b = round(b); k = round(k); float a = b * k;
  g = newGraph(); float x0 = -5.5; float sc = 9 / (12.0 * 12);
  addNode(g, "b0", [x0, 1.5]); addNode(g, "b1", [x0 + sc * b, 1.5]); addEdge(g, "b0", "b1", 1, "#f59e0b");
  addNode(g, "a0", [x0, -1.5]); addNode(g, "a1", [x0 + sc * a, -1.5]); addEdge(g, "a0", "a1", 1, "#22c55e");
  info = "**Кратное:** число a называется кратным числа b, если a = b · k для некоторого натурального k.\n\nb = " + format(b, 0) + " (оранжевый отрезок), k = " + format(k, 0) + " ⇒ a = " + format(b, 0) + " × " + format(k, 0) + " = **" + format(a, 0) + "** (зелёный отрезок, в " + format(k, 0) + " раз длиннее оранжевого).";
}
]
