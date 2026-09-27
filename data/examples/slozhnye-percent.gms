[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float P = 200; float r = 5; float t = 3; string info = ""; float S = 0; float I = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "P"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "I"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "S"; size = 0.9 }
new UI { type = slider; label = "сумма P"; variable = P; min = 10; max = 500; step = 10; default = 200 }
new UI { type = slider; label = "ставка r%"; variable = r; min = 1; max = 15; step = 1; default = 5 }
new UI { type = slider; label = "время t лет"; variable = t; min = 1; max = 5; step = 1; default = 3 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 1000;
Update {
  float coeff = pow(1 + r / 100, t);
  S = P * coeff;
  I = S - P;
  g = newGraph(); bar("a", -3, P, "#3b82f6"); bar("b", 0, I, "#f59e0b"); bar("c", 3, S, "#22c55e");
  info = "Сложные проценты: S = " + format(P, 0) + " × (1 + " + format(r, 0) + "/100) в степени " + format(t, 0) + " = **" + format(S, 1) + "**. Доход I = " + format(S, 1) + " − " + format(P, 0) + " = **" + format(I, 1) + "**.";
}
]
