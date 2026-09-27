[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float x = 1234; float n = 3; string info = ""; float rx = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "x"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.5); text = "округлено"; size = 0.9 }
new UI { type = slider; label = "число x"; variable = x; min = 1; max = 9999; step = 1; default = 1234 }
new UI { type = slider; label = "значащих цифр n"; variable = n; min = 1; max = 6; step = 1; default = 3 }
Function bar(k, xp, v, c) { addNode(g, k + "0", [xp, -3]); addNode(g, k + "1", [xp, -3 + 6 * v / 9999]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float ord = floor(log(x) / log(10)); float dec = n - ord - 1; float sc = pow(10, dec); rx = round(x * sc) / sc;
  g = newGraph(); bar("a", -3, x, "#3b82f6"); bar("b", 3, rx, "#f59e0b");
  info = "**Значащие цифры**: у числа x = " + format(x, 1) + " берём n = " + format(n, 0) + " значащих цифр, считая от первой ненулевой слева, — получаем округлённое число " + format(rx, max(dec, 0)) + ", в котором ровно " + format(n, 0) + " значащих цифр.";
}
]
