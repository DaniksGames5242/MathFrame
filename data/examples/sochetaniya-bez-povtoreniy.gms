[
description = "{info}"
field width = 14; field height = 9;
camera type = fixed;
float n = 6; float k = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
new UI { type = slider; label = "n"; variable = n; min = 3; max = 10; step = 1; default = 6 }
new UI { type = slider; label = "k"; variable = k; min = 0; max = n; step = 1; default = 3 }
Function fact(n) { float r = 1; repeat (12) { if (i < n) { r = r * (i + 1); } } return r; }
Update {
  float val = fact(n) / (fact(k) * fact(n - k));
  g = newGraph(); addNode(g, "x0", [0, -3.5]); addNode(g, "x1", [0, -3.5 + 6 * val / 252]); addEdge(g, "x0", "x1", 1, "#3b82f6");
  info = "Из n = " + format(n,0) + " элементов выбираем группу из k = " + format(k,0) + " так, что каждый элемент попадает в неё не больше одного раза, а порядок внутри группы не важен. Число сочетаний без повторений C(n,k) = n!/(k!·(n − k)!) = **" + format(val,0) + "**.";
}
]
