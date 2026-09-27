[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 1; float b = 3; float k = 2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "a/b"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.5); text = "(a·k)/(b·k)"; size = 0.9 }
new UI { type = slider; label = "числитель a"; variable = a; min = 1; max = 9; step = 1; default = 1 }
new UI { type = slider; label = "знаменатель b"; variable = b; min = 2; max = 10; step = 1; default = 3 }
new UI { type = slider; label = "множитель k"; variable = k; min = 1; max = 5; step = 1; default = 2 }
Function bar(x, v, c) { addNode(g, "n" + format(x, 0), [x, -3]); addNode(g, "m" + format(x, 0), [x, -3 + 6 * v]); addEdge(g, "n" + format(x, 0), "m" + format(x, 0), 1, c); }
Update {
  if (a >= b) { a = b - 1; }
  float v = a / b;
  g = newGraph(); bar(-3, v, "#3b82f6"); bar(3, v, "#f59e0b");
  info = "**Основное свойство дроби**: " + format(a, 0) + "/" + format(b, 0) + " = " + format(a * k, 0) + "/" + format(b * k, 0) + " = " + format(v, 3) + ".\n\nЧислитель и знаменатель умножены на одно и то же число k = " + format(k, 0) + ", значение дроби не изменилось.";
}
]
