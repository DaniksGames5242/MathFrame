[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 6; float b = 8; string info = ""; float d = 1;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "a/b"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.5); text = "несократимая"; size = 0.9 }
new UI { type = slider; label = "числитель a"; variable = a; min = 1; max = 12; step = 1; default = 6 }
new UI { type = slider; label = "знаменатель b"; variable = b; min = 2; max = 12; step = 1; default = 8 }
Function bar(x, v, c) { addNode(g, "n" + format(x, 0), [x, -3]); addNode(g, "m" + format(x, 0), [x, -3 + 6 * v]); addEdge(g, "n" + format(x, 0), "m" + format(x, 0), 1, c); }
Function gcd(x, y) { float p = x; float q = y; repeat (30) { if (q < 0.5) { return p; } float r = p - q * floor(p / q); p = q; q = r; } return p; }
Update {
  if (a >= b) { a = b - 1; }
  d = gcd(a, b);
  float na = a / d; float nb = b / d;
  float v = a / b;
  g = newGraph(); bar(-3, v, "#3b82f6"); bar(3, v, "#f59e0b");
  info = "НОД(" + format(a, 0) + ", " + format(b, 0) + ") = " + format(d, 0) + ".\n\n**Сокращение**: " + format(a, 0) + "/" + format(b, 0) + " = " + format(na, 0) + "/" + format(nb, 0) + " — числитель и знаменатель разделены на НОД, значение дроби " + format(v, 3) + " не изменилось.";
}
]
