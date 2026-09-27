[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float n = 50; float m = 32; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
new UI { type = slider; label = "число испытаний n"; variable = n; min = 10; max = 200; step = 1; default = 50 }
new UI { type = slider; label = "число успехов m"; variable = m; min = 0; max = n; step = 1; default = 32 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -4]); addNode(g, k + "1", [x, -4 + 8 * v]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float w = m / n;
  g = newGraph(); bar("a", 0, w, "#3b82f6");
  info = "**Статистическое (частотное) определение вероятности**: относительная частота W = m/n, где m — число испытаний, в которых событие произошло, n — общее число испытаний.\n\nПри n = " + format(n, 0) + ", m = " + format(m, 0) + " частота W = " + format(w, 3) + ". С увеличением n частота стабилизируется около некоторого числа — его и принимают за вероятность события.";
}
]
