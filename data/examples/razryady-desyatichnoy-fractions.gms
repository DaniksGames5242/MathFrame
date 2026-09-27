[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float t1 = 4; float t2 = 5; float t3 = 6; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; labels = false; interactive = false }
new UI { type = slider; label = "десятые"; variable = t1; min = 0; max = 9; step = 1; default = 4 }
new UI { type = slider; label = "сотые"; variable = t2; min = 0; max = 9; step = 1; default = 5 }
new UI { type = slider; label = "тысячные"; variable = t3; min = 0; max = 9; step = 1; default = 6 }
Function bar(x, v, c2) { addNode(g, "n" + format(x, 0), [x, -3]); addNode(g, "m" + format(x, 0), [x, -3 + 6 * v / 0.9]); addEdge(g, "n" + format(x, 0), "m" + format(x, 0), 1, c2); }
Update {
  float v = t1 / 10 + t2 / 100 + t3 / 1000;
  g = newGraph(); bar(-4, t1 / 10, "#3b82f6"); bar(0, t2 / 100, "#f59e0b"); bar(4, t3 / 1000, "#22c55e");
  info = "**0," + format(t1, 0) + format(t2, 0) + format(t3, 0) + "** = " + format(t1, 0) + "/10 + " + format(t2, 0) + "/100 + " + format(t3, 0) + "/1000 = " + format(v, 3) + ".\n\nСиний столбик — разряд десятых, оранжевый — сотых, зелёный — тысячных: каждый следующий разряд в 10 раз меньше предыдущего.";
}
]
