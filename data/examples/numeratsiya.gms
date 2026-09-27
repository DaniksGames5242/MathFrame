[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float N = 3457; float key = -1; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 22; labels = false; interactive = false }
draw Text { name = "l0"; pos = (-4.5, -3.6); text = "тыс."; size = 0.8 }
draw Text { name = "l1"; pos = (-1.5, -3.6); text = "сот."; size = 0.8 }
draw Text { name = "l2"; pos = (1.5, -3.6); text = "дес."; size = 0.8 }
draw Text { name = "l3"; pos = (4.5, -3.6); text = "ед."; size = 0.8 }
new UI { type = slider; label = "число N"; variable = N; min = 0; max = 9999; step = 1; default = 3457 }
Function bar(px, v, c) { addNode(g, "a" + format(px, 0), [px, -3]); addNode(g, "b" + format(px, 0), [px, -3 + 0.5 * v]); addEdge(g, "a" + format(px, 0), "b" + format(px, 0), 1, c); }
Update {
  if (key != N) {
    float d3 = floor(N / 1000); float d2 = floor((N - d3 * 1000) / 100); float d1 = floor((N - d3 * 1000 - d2 * 100) / 10); float d0 = N - d3 * 1000 - d2 * 100 - d1 * 10;
    g = newGraph(); bar(-4.5, d3, "#3b82f6"); bar(-1.5, d2, "#3b82f6"); bar(1.5, d1, "#3b82f6"); bar(4.5, d0, "#3b82f6");
    info = "**Нумерация:** число N = " + format(N, 0) + " записывается цифрами, каждая на своей позиции (разряде): тысячи " + format(d3, 0) + ", сотни " + format(d2, 0) + ", десятки " + format(d1, 0) + ", единицы " + format(d0, 0) + ".\n\nЗначение цифры зависит от позиции: N = " + format(d3, 0) + "·1000 + " + format(d2, 0) + "·100 + " + format(d1, 0) + "·10 + " + format(d0, 0) + "·1.";
    key = N;
  }
}
]
