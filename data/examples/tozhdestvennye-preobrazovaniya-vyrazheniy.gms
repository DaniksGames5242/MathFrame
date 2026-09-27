[
description = "{info}"
field width = 10; field height = 8;
camera type = fixed;
float x = 1; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 25; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-2.5, -3.7); text = "2x+3x"; size = 0.8 }
draw Text { name = "l2"; pos = (2.5, -3.7); text = "5x"; size = 0.8 }
new UI { type = slider; label = "x"; variable = x; min = -4; max = 4; step = 0.5; default = 1 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  float lhs = 2 * x + 3 * x;
  float h = lhs / 20 * 3; if (h > 3) { h = 3; } if (h < -3) { h = -3; }
  g = newGraph(); addNode(g, "a0", [-2.5, 0]); addNode(g, "a1", [-2.5, h]); addEdge(g, "a0", "a1", 1, "#3b82f6");
  addNode(g, "b0", [2.5, 0]); addNode(g, "b1", [2.5, h]); addEdge(g, "b0", "b1", 1, "#f59e0b");
  info = "**Тождественное преобразование** 2x+3x = 5x: приведение подобных слагаемых не меняет значение выражения при любом x. При x = " + num(x,1) + " обе записи равны " + num(lhs,1) + ".";
}
]
