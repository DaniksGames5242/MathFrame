[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 3; float b = 7; float c = 2; float d = 5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "a/b"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.5); text = "c/d"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = 1; max = 6; step = 1; default = 3 }
new UI { type = slider; label = "b"; variable = b; min = 2; max = 9; step = 1; default = 7 }
new UI { type = slider; label = "c"; variable = c; min = 1; max = 6; step = 1; default = 2 }
new UI { type = slider; label = "d"; variable = d; min = 2; max = 9; step = 1; default = 5 }
Function bar(x, v, c2) { addNode(g, "n" + format(x, 0), [x, -3]); addNode(g, "m" + format(x, 0), [x, -3 + 6 * v]); addEdge(g, "n" + format(x, 0), "m" + format(x, 0), 1, c2); }
Update {
  if (a >= b) { a = b - 1; } if (c >= d) { c = d - 1; }
  float v1 = a / b; float v2 = c / d;
  g = newGraph(); bar(-3, v1, "#3b82f6"); bar(3, v2, "#f59e0b");
  string rel = "="; if (v1 > v2) { rel = ">"; } if (v1 < v2) { rel = "<"; }
  info = format(a, 0) + "/" + format(b, 0) + " " + rel + " " + format(c, 0) + "/" + format(d, 0) + " (" + format(v1, 3) + " и " + format(v2, 3) + ").\n\nСравнение через приведение к общему знаменателю или деление: чья дробь больше, у той столбик выше.";
}
]
