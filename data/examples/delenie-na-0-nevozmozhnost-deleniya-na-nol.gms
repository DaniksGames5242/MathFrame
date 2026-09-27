[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 5; float c = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.6); text = "a"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.6); text = "0 × c"; size = 0.9 }
new UI { type = slider; label = "число a"; variable = a; min = 0; max = 10; step = 1; default = 5 }
new UI { type = slider; label = "пробуем c"; variable = c; min = 0; max = 10; step = 1; default = 3 }
Function bar(k, x, v, cc) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 5.4 * v / 10]); addEdge(g, k + "0", k + "1", 1, cc); }
Update {
  float p = 0 * c;
  g = newGraph(); bar("a2", -3, a, "#3b82f6"); bar("b2", 3, p, "#f59e0b");
  string m = "поэтому такого c не существует — на 0 делить нельзя.";
  if (a < 0.5) { m = "равенство 0 × c = 0 = a верно для ЛЮБОГО c — результат неоднозначен, поэтому деление на 0 запрещено даже в этом случае."; }
  info = "**a : 0 = c** означало бы 0 × c = a. Но 0 × " + format(c, 0) + " = " + format(p, 0) + ", а a = " + format(a, 0) + " — " + m;
}
]
