[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 200; float b = 100; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "a − b"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "b − a"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "разные"; size = 0.9 }
new UI { type = slider; label = "число a"; variable = a; min = 100; max = 300; step = 10; default = 200 }
new UI { type = slider; label = "число b"; variable = b; min = 50; max = 200; step = 10; default = 100 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 300;
Update {
  float d1 = a - b;
  float d2 = 0;
  if (b > a) { d2 = 0; } else { d2 = b - a; if (b < a) { d2 = 0; } }
  if (a > b) { d2 = 0; }
  g = newGraph(); bar("a", -3, d1, "#3b82f6"); bar("b", 0, a - b, "#f59e0b"); bar("c", 3, a - b, "#22c55e");
  info = format(a, 0) + " − " + format(b, 0) + " = " + format(d1, 0) + ", но " + format(b, 0) + " − " + format(a, 0) + " не натуральное число. Вычитание **не переместительно**.";
}
]
