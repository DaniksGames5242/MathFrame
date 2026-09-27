[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float v = 60; float t = 3; string info = ""; float s = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "км/ч"; size = 0.85 }
draw Text { name = "l2"; pos = (0, -3.5); text = "часы"; size = 0.85 }
draw Text { name = "l3"; pos = (3, -3.5); text = "км"; size = 0.85 }
new UI { type = slider; label = "скорость (км/ч)"; variable = v; min = 20; max = 100; step = 10; default = 60 }
new UI { type = slider; label = "время (ч)"; variable = t; min = 1; max = 5; step = 1; default = 3 }
Function bar(k, x_pos, v_val, c) { addNode(g, k + "0", [x_pos, -3]); addNode(g, k + "1", [x_pos, -3 + 6 * v_val / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 500;
Update {
  s = v * t;
  g = newGraph(); bar("a", -3, v, "#3b82f6"); bar("b", 0, t * 50, "#f59e0b"); bar("c", 3, s / 3, "#22c55e");
  info = "Задача на движение: скорость " + format(v, 0) + " км/ч × " + format(t, 0) + " ч = **" + format(s, 0) + " км**.";
}
]
