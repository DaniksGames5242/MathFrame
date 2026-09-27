[
description = "{info}"
field width = 14; field height = 9;
camera type = fixed;
float n = 10; float m = 2; float k = 4; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
new UI { type = slider; label = "всего людей n"; variable = n; min = 5; max = 12; step = 1; default = 10 }
new UI { type = slider; label = "исключены m"; variable = m; min = 0; max = n - 2; step = 1; default = 2 }
new UI { type = slider; label = "размер группы k"; variable = k; min = 1; max = n - m; step = 1; default = 4 }
Function fact(a) { float r = 1; repeat (12) { if (i < a) { r = r * (i + 1); } } return r; }
Update {
  float avail = n - m; float val = fact(avail) / (fact(k) * fact(avail - k));
  g = newGraph(); addNode(g, "x0", [0, -3.5]); addNode(g, "x1", [0, -3.5 + 6 * val / 924]); addEdge(g, "x0", "x1", 1, "#3b82f6");
  info = "Из n = " + format(n,0) + " человек m = " + format(m,0) + " не могут войти в группу по условию задачи. Доступны n − m = " + format(avail,0) + " человек, из них выбираем k = " + format(k,0) + ": C(" + format(avail,0) + "," + format(k,0) + ") = **" + format(val,0) + "** способов — ограничение просто уменьшает n в обычной формуле сочетаний.";
}
]
