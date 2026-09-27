[
description = "{info}"
field width = 14; field height = 9;
camera type = fixed;
float n = 3; float k = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
new UI { type = slider; label = "n"; variable = n; min = 2; max = 6; step = 1; default = 3 }
new UI { type = slider; label = "k"; variable = k; min = 1; max = 6; step = 1; default = 3 }
Function pw(n, k) { float r = 1; repeat (6) { if (i < k) { r = r * n; } } return r; }
Update {
  float val = pw(n, k);
  g = newGraph(); addNode(g, "x0", [0, -3.5]); addNode(g, "x1", [0, -3.5 + 6 * val / 46656]); addEdge(g, "x0", "x1", 1, "#3b82f6");
  info = "Каждый из k = " + format(k,0) + " выборов делается заново из n = " + format(n,0) + " вариантов, и повторяться они могут. Число размещений с повторениями Aᵏₙ = nᵏ = " + format(n,0) + "ᵏ = **" + format(val,0) + "**.";
}
]
