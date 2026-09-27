[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 30; float b = 20; string info = ""; float s = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "Слагаемое a"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "Слагаемое b"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "Сумма"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = 10; max = 60; step = 5; default = 30 }
new UI { type = slider; label = "b"; variable = b; min = 10; max = 60; step = 5; default = 20 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 120;
Update {
  s = a + b;
  g = newGraph(); bar("a", -3, a, "#3b82f6"); bar("b", 0, b, "#f59e0b"); bar("c", 3, s, "#22c55e");
  info = format(a, 0) + " + " + format(b, 0) + " = " + format(s, 0) + ". Проверка вычитанием: " + format(s, 0) + " − " + format(a, 0) + " = **" + format(b, 0) + "**.";
}
]
