[
description = "{info}"
field width = 12; field height = 6;
camera type = fixed;
float h = 1.5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; labels = false; interactive = false }
new UI { type = slider; label = "время, ч"; variable = h; min = 0.1; max = 3; step = 0.1; default = 1.5 }
Update {
  g = newGraph(); addNode(g, "0", [-5, 0]); addNode(g, "1", [-5 + h * 3, 0]); addEdge(g, "0", "1", 1, "#22c55e");
  info = "**" + format(h, 1) + " ч = " + format(h * 60, 0) + " мин = " + format(h * 3600, 0) + " с** — в отличие от единиц длины и массы, час делится на 60 минут, а минута — на 60 секунд (не на степени десяти).";
}
]
