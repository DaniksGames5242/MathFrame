[
description = "{info}"
field width = 10; field height = 8;
camera type = fixed;
float m = 3.2; float k = 5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "мантисса m"; variable = m; min = 1; max = 9.9; step = 0.1; default = 3.2 }
new UI { type = slider; label = "порядок k"; variable = k; min = -6; max = 6; step = 1; default = 5 }
Update {
  g = newGraph(); addNode(g, "p0", [0, 0]); addNode(g, "p1", [0, k / 2]); addEdge(g, "p0", "p1", 1, "#3b82f6");
  info = "**Стандартный вид числа:** N = m × 10 в степени k, где 1 ≤ m < 10, а k — целое число.\n\nПри m = " + format(m, 1) + ", k = " + format(k, 0) + ": число N = " + format(m, 1) + " × 10 в степени " + format(k, 0) + " (столбик показывает порядок k: выше нуля — большие числа, ниже — малые).";
}
]
