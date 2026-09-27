[
description = "{info}"
field width = 10; field height = 10;
camera type = fixed;
float a = 0.6; string info = ""; float VMAX = 3375;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 24; edgeColor = #3b82f6; edgeCap = butt; labels = false; interactive = false }
draw Text { name = "l1"; pos = (0, -4.6); text = "объём в литрах"; size = 0.85 }
new UI { type = slider; label = "ребро куба a (м)"; variable = a; min = 0.1; max = 1.5; step = 0.05; default = 0.6 }
Update {
  float v = a * a * a; float l = v * 1000;
  g = newGraph(); addNode(g, "b0", [0, -4]); addNode(g, "b1", [0, -4 + 8 * l / VMAX]); addEdge(g, "b0", "b1");
  info = "**Объём куба** со стороной a = " + format(a, 2) + " м равен V = a³ = " + format(v, 3) + " м³.\n\nВ литрах (1 м³ = 1000 л): V = " + format(l, 1) + " л.";
}
]
