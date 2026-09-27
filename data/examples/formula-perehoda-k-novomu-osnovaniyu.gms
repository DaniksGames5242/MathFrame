[
description = "{info}"
field width = 10; field height = 8;
camera type = fixed;
float a = 3; float b = 10; float x = 27; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-2, -3.6); text = "logₐ x"; size = 0.9 }
draw Text { name = "l2"; pos = (2, -3.6); text = "logᵦ x / logᵦ a"; size = 0.85 }
new UI { type = slider; label = "основание a"; variable = a; min = 2; max = 10; step = 0.5; default = 3 }
new UI { type = slider; label = "основание b"; variable = b; min = 2; max = 10; step = 0.5; default = 10 }
new UI { type = slider; label = "число x"; variable = x; min = 1; max = 50; step = 1; default = 27 }
Function bar(k, px, v, c) { addNode(g, k + "0", [px, -3]); addNode(g, k + "1", [px, -3 + 5 * v / 4]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  if (abs(b - 1) < 0.2) { b = 1.3; }
  float v1 = log(x) / log(a);
  float v2 = (log(x) / log(b)) / (log(a) / log(b));
  g = newGraph(); bar("p", -2, v1, "#3b82f6"); bar("q", 2, v2, "#f59e0b");
  info = "**Формула перехода к новому основанию:** logₐ x = logᵦ x / logᵦ a.\n\nПри a = " + format(a, 1) + ", b = " + format(b, 1) + ", x = " + format(x, 0) + ": logₐ x = " + format(v1, 3) + ", а logᵦ x / logᵦ a = " + format(v2, 3) + " — те же самое число, посчитанное через другое основание.";
}
]
