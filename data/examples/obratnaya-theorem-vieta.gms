[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float s = 4; float p = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "x₁"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "x₂"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "s·p"; size = 0.9 }
new UI { type = slider; label = "s (сумма)"; variable = s; min = 1; max = 6; step = 0.1; default = 4 }
new UI { type = slider; label = "p (произвед.)"; variable = p; min = 0.5; max = 4; step = 0.1; default = 3 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 24;
Update {
  float D = s * s - 4 * p; float x1 = D >= 0 ? (s - sqrt(D)) / 2 : 0; float x2 = D >= 0 ? (s + sqrt(D)) / 2 : 0;
  g = newGraph(); bar("a", -3, x1 > 0 ? x1 : 0, "#3b82f6"); bar("b", 0, x2 > 0 ? x2 : 0, "#f59e0b"); bar("c", 3, s * p, "#22c55e");
  info = "Обратная теорема Виета: если x₁ + x₂ = " + format(s, 1) + " и x₁·x₂ = " + format(p, 1) + ", то x₁ и x₂ — корни уравнения **x² − " + format(s, 1) + "x + " + format(p, 1) + " = 0** (D = " + format(D, 1) + (D >= 0 ? "" : ", действительных корней нет") + ").";
}
]
