[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float N = 2345; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 26; labels = false; interactive = false }
draw Text { name = "l0"; pos = (-4.5, -3.6); text = "тыс."; size = 0.8 }
draw Text { name = "l1"; pos = (-1.5, -3.6); text = "сот."; size = 0.8 }
draw Text { name = "l2"; pos = (1.5, -3.6); text = "дес."; size = 0.8 }
draw Text { name = "l3"; pos = (4.5, -3.6); text = "ед."; size = 0.8 }
new UI { type = slider; label = "число N"; variable = N; min = 0; max = 9999; step = 1; default = 2345 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 3.3 * v / 9]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float n = round(N);
  float d3 = floor(n / 1000); float d2 = floor((n - d3 * 1000) / 100); float d1 = floor((n - d3 * 1000 - d2 * 100) / 10); float d0 = n - d3 * 1000 - d2 * 100 - d1 * 10;
  g = newGraph(); bar("a", -4.5, d3, "#3b82f6"); bar("b", -1.5, d2, "#3b82f6"); bar("c2", 1.5, d1, "#3b82f6"); bar("d2", 4.5, d0, "#3b82f6");
  info = "**Число " + format(n, 0) + "** = " + format(d3, 0) + "·1000 + " + format(d2, 0) + "·100 + " + format(d1, 0) + "·10 + " + format(d0, 0) + ". Каждая цифра стоит в своём разряде: тысячи, сотни, десятки, единицы — её значение зависит от позиции в записи числа.";
}
]
