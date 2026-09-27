[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 4; float b = 3; string info = ""; float s1 = 0; float s2 = 0; float s3 = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "1-е действие"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "2-е действие"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "Итог"; size = 0.9 }
new UI { type = slider; label = "первое число"; variable = a; min = 1; max = 10; step = 1; default = 4 }
new UI { type = slider; label = "второе число"; variable = b; min = 1; max = 10; step = 1; default = 3 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 50;
Update {
  s1 = a * b; s2 = a + b; s3 = s1 + s2;
  g = newGraph(); bar("a", -3, s1, "#3b82f6"); bar("b", 0, s2, "#f59e0b"); bar("c", 3, s3, "#22c55e");
  info = "В выражении " + format(a, 0) + " × " + format(b, 0) + " + " + format(a, 0) + " + " + format(b, 0) + " сначала выполняется умножение (×), затем слагаемое слева направо (+). Результат: " + format(s1, 0) + " + " + format(s2, 0) + " = **" + format(s3, 0) + "**.";
}
]
