[
description = "{info}"
field width = 14; field height = 9;
camera type = fixed;
float n = 4; float k = 4; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
new UI { type = slider; label = "видов n"; variable = n; min = 2; max = 6; step = 1; default = 4 }
new UI { type = slider; label = "выборок k"; variable = k; min = 1; max = 8; step = 1; default = 4 }
Function fact(m) { float r = 1; repeat (14) { if (i < m) { r = r * (i + 1); } } return r; }
Update {
  float m = n + k - 1; float val = fact(m) / (fact(k) * fact(m - k));
  g = newGraph(); addNode(g, "x0", [0, -3.5]); addNode(g, "x1", [0, -3.5 + 6 * val / 1287]); addEdge(g, "x0", "x1", 1, "#3b82f6");
  info = "Выбираем k = " + format(k,0) + " предметов из n = " + format(n,0) + " видов, повторяя виды сколько угодно раз (порядок не важен). Число сочетаний с повторениями C̄(n,k) = C(n + k − 1, k) = **" + format(val,0) + "**.";
}
]
