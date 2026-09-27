[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float A = 48; float B = 23; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.6); text = "min оценка"; size = 0.8 }
draw Text { name = "l2"; pos = (3, -3.6); text = "max оценка"; size = 0.8 }
new UI { type = slider; label = "A"; variable = A; min = 1; max = 100; step = 1; default = 48 }
new UI { type = slider; label = "B"; variable = B; min = 1; max = 100; step = 1; default = 23 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 5.4 * v / 12100]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float lo = floor(A / 10) * 10; float hi = lo + 10; float loB = floor(B / 10) * 10; float hiB = loB + 10;
  float emin = lo * loB; float emax = hi * hiB;
  g = newGraph(); bar("a", -3, emin, "#3b82f6"); bar("b", 3, emax, "#f59e0b");
  info = "Округляя A и B **вниз** до десятков, получаем нижнюю оценку произведения — **" + format(emin, 0) + "**; округляя **вверх** — верхнюю — **" + format(emax, 0) + "**. Истинное значение A × B = " + format(A * B, 0) + " лежит между ними.";
}
]
