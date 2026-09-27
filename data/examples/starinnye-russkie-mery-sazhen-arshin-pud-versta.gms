[
description = "{info}"
field width = 10; field height = 10;
camera type = fixed;
float L = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; edgeCap = butt; edgeColor = #3b82f6; labels = false; interactive = false }
draw Text { name = "l1"; pos = (0, -4.6); text = "L, метры"; size = 0.85 }
new UI { type = slider; label = "длина L (м)"; variable = L; min = 0.5; max = 5; step = 0.1; default = 3 }
Update {
  float ar = L / 0.7112; float sz = L / 2.13;
  g = newGraph(); addNode(g, "b0", [0, -4]); addNode(g, "b1", [0, -4 + 8 * L / 5]); addEdge(g, "b0", "b1");
  info = "**Длина L = " + format(L, 2) + " м** в старинных русских мерах: " + format(ar, 2) + " аршина (1 аршин ≈ 0,71 м) и " + format(sz, 2) + " большой сажени (1 сажень ≈ 2,13 м).";
}
]
