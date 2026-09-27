[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float A = 48; float B = 23; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.6); text = "точно"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.6); text = "прикидка"; size = 0.9 }
new UI { type = slider; label = "A"; variable = A; min = 1; max = 100; step = 1; default = 48 }
new UI { type = slider; label = "B"; variable = B; min = 1; max = 100; step = 1; default = 23 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 5.4 * v / 10000]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float ra = round(A / 10) * 10; float rb = round(B / 10) * 10;
  float exact = A * B; float est = ra * rb;
  g = newGraph(); bar("a", -3, exact, "#3b82f6"); bar("b", 3, est, "#f59e0b");
  info = "Точное произведение " + format(A, 0) + " × " + format(B, 0) + " = " + format(exact, 0) + ". Прикидка: округлим A и B до десятков — " + format(ra, 0) + " × " + format(rb, 0) + " = **" + format(est, 0) + "** — быстрая проверка порядка результата без точного счёта.";
}
]
