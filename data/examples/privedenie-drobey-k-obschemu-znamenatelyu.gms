[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 1; float b = 4; float c = 1; float d = 6; string info = ""; float L = 12;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "a/b"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.5); text = "c/d"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = 1; max = 5; step = 1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = 2; max = 9; step = 1; default = 4 }
new UI { type = slider; label = "c"; variable = c; min = 1; max = 5; step = 1; default = 1 }
new UI { type = slider; label = "d"; variable = d; min = 2; max = 9; step = 1; default = 6 }
Function gcd(x, y) { float p = x; float q = y; repeat (30) { if (q < 0.5) { return p; } float r = p - q * floor(p / q); p = q; q = r; } return p; }
Function bar(x, v, c2) { addNode(g, "n" + format(x, 0), [x, -3]); addNode(g, "m" + format(x, 0), [x, -3 + 6 * v]); addEdge(g, "n" + format(x, 0), "m" + format(x, 0), 1, c2); }
Update {
  if (a >= b) { a = b - 1; } if (c >= d) { c = d - 1; }
  L = b * d / gcd(b, d);
  float na = a * (L / b); float nc = c * (L / d);
  g = newGraph(); bar(-3, a / b, "#3b82f6"); bar(3, c / d, "#f59e0b");
  info = "**Общий знаменатель** (НОК " + format(b, 0) + " и " + format(d, 0) + ") = " + format(L, 0) + ".\n\n" + format(a, 0) + "/" + format(b, 0) + " = " + format(na, 0) + "/" + format(L, 0) + ", " + format(c, 0) + "/" + format(d, 0) + " = " + format(nc, 0) + "/" + format(L, 0) + ".";
}
]
