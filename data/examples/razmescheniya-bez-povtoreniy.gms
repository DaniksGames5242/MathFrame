[
description = "{info}"
field width = 14; field height = 9;
camera type = fixed;
float n = 6; float k = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
new UI { type = slider; label = "n"; variable = n; min = 3; max = 8; step = 1; default = 6 }
new UI { type = slider; label = "k"; variable = k; min = 1; max = n; step = 1; default = 3 }
Function fact(n) { float r = 1; repeat (10) { if (i < n) { r = r * (i + 1); } } return r; }
Update {
  float val = fact(n) / fact(n - k);
  g = newGraph(); addNode(g, "x0", [0, -3.5]); addNode(g, "x1", [0, -3.5 + 6 * val / 40320]); addEdge(g, "x0", "x1", 1, "#3b82f6");
  info = "Из n = " + format(n,0) + " элементов выбираем k = " + format(k,0) + " и располагаем по порядку так, что каждый элемент используется не больше одного раза. Число размещений без повторений A(n,k) = n!/(n − k)! = " + format(n,0) + "!/" + format(n-k,0) + "! = **" + format(val,0) + "**.";
}
]
