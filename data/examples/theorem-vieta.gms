[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float p = 3; float q = 2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "x₁ + x₂"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "x₁ × x₂"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "D"; size = 0.9 }
new UI { type = slider; label = "−p (сумма)"; variable = p; min = 0.5; max = 5; step = 0.1; default = 3 }
new UI { type = slider; label = "q (произвед.)"; variable = q; min = 0.5; max = 4; step = 0.1; default = 2 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 25;
Update {
  float D = p * p - 4 * q;
  g = newGraph(); bar("a", -3, p, "#3b82f6"); bar("b", 0, q, "#f59e0b"); bar("c", 3, D >= 0 ? D : 0, "#22c55e");
  info = "**x² − px + q = 0** при p = " + format(p, 1) + ", q = " + format(q, 1) + ": по Виета x₁ + x₂ = " + format(p, 1) + ", x₁·x₂ = " + format(q, 1) + ", дискриминант D = " + format(D, 1) + ".";
}
]
