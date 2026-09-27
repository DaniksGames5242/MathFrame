[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 2; float b = 3; float x = 1; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "a"; variable = a; min = -5; max = 5; step = 1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = -5; max = 5; step = 1; default = 3 }
new UI { type = slider; label = "x"; variable = x; min = -5; max = 5; step = 1; default = 1 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  float v = a * x + b;
  float h = v / 10 * 3; if (h > 3) { h = 3; } if (h < -3) { h = -3; }
  g = newGraph(); addNode(g, "p0", [0, -3]); addNode(g, "p1", [0, -3 + h]); addEdge(g, "p0", "p1", 1, "#3b82f6");
  info = "**Буквенное выражение** ax + b при a = " + num(a,0) + ", x = " + num(x,0) + ", b = " + num(b,0) + " равно " + num(v,0) + ".\n\nПодстановка других чисел вместо x, a, b даёт другое числовое выражение — запись ax + b описывает их все сразу.";
}
]
