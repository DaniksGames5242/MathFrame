[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float v1 = 60; float v2 = 40; string info = ""; float harm = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "v₁"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "v₂"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "v_ср"; size = 0.9 }
new UI { type = slider; label = "скорость v₁ (км/ч)"; variable = v1; min = 10; max = 100; step = 5; default = 60 }
new UI { type = slider; label = "скорость v₂ (км/ч)"; variable = v2; min = 10; max = 100; step = 5; default = 40 }
Function bar(n, x, v, c) { addNode(g, n + "0", [x, -3]); addNode(g, n + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, n + "0", n + "1", 1, c); }
float VMAX = 100;
Update {
  harm = 2 * v1 * v2 / (v1 + v2);
  g = newGraph(); bar("v1", -3, v1, "#3b82f6"); bar("v2", 0, v2, "#f59e0b"); bar("h", 3, harm, "#22c55e");
  info = "Средняя скорость при равных расстояниях: 2 × " + format(v1, 0) + " × " + format(v2, 0) + " / (" + format(v1, 0) + " + " + format(v2, 0) + ") = **" + format(harm, 1) + "** км/ч.";
}
]
