[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 1; float q = 1.6; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 26; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.6); text = "a₁"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.6); text = "a₂"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.6); text = "a₃"; size = 0.9 }
new UI { type = slider; label = "a₁"; variable = a; min = 0.5; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "q"; variable = q; min = 0.4; max = 1.8; step = 0.1; default = 1.6 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + v]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float a2 = a * q; float a3 = a2 * q;
  g = newGraph(); bar("a", -3, a, "#3b82f6"); bar("b", 0, a2, "#f59e0b"); bar("c", 3, a3, "#22c55e");
  info = "**Характеристическое свойство геометрической прогрессии:** aₙ₊₁ / aₙ = q — отношение любого члена к предыдущему постоянно.\n\nПри a₁ = " + format(a, 2) + ", q = " + format(q, 2) + ": a₂ = " + format(a2, 2) + ", a₃ = " + format(a3, 2) + "; a₂/a₁ = " + format(a2 / a, 3) + " и a₃/a₂ = " + format(a3 / a2, 3) + " равны.";
}
]
