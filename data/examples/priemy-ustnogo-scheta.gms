[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 23; string k = "9"; string info = "";
new UI { type = slider; label = "число a"; variable = a; min = 1; max = 99; step = 1; default = 23 }
new UI { type = select; label = "множитель"; variable = k; options = ("9", "11"); labels = ("× 9", "× 11"); default = "9" }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (0, -3.6); text = "a × " + k; size = 0.9 }
Function bar(k2, x, v, c) { addNode(g, k2 + "0", [x, -3]); addNode(g, k2 + "1", [x, -3 + 5.4 * v / 1100]); addEdge(g, k2 + "0", k2 + "1", 1, c); }
Update {
  float r = a * 10; string s = "";
  if (k == "9") { r = a * 10 - a; s = format(a, 0) + " × 10 − " + format(a, 0) + " = " + format(a * 10, 0) + " − " + format(a, 0); }
  if (k == "11") { r = a * 10 + a; s = format(a, 0) + " × 10 + " + format(a, 0) + " = " + format(a * 10, 0) + " + " + format(a, 0); }
  g = newGraph(); bar("a2", 0, r, "#3b82f6");
  info = "**Приём устного счёта:** " + format(a, 0) + " × " + k + " = " + s + " = **" + format(r, 0) + "**. Умножение на 9 или 11 удобно заменить умножением на 10 с поправкой — вычитанием или сложением числа a.";
}
]
