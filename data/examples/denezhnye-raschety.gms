[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float p = 50; float q = 3; float m = 200; string info = ""; float total = 0; float ch = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "уплачено"; size = 0.85 }
draw Text { name = "l2"; pos = (3, -3.5); text = "стоимость"; size = 0.85 }
new UI { type = slider; label = "цена товара p"; variable = p; min = 1; max = 100; step = 1; default = 50 }
new UI { type = slider; label = "количество q"; variable = q; min = 1; max = 10; step = 1; default = 3 }
new UI { type = slider; label = "уплачено m"; variable = m; min = 0; max = 1000; step = 10; default = 200 }
Function bar(k, xp, v, c) { addNode(g, k + "0", [xp, -3]); addNode(g, k + "1", [xp, -3 + 6 * v / 1000]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  total = p * q; ch = m - total;
  g = newGraph(); bar("a", -3, m, "#3b82f6"); bar("b", 3, total, "#f59e0b");
  string cs = "остаётся сдать на руки " + format(ch, 0);
  if (ch < 0) { cs = "не хватает ещё " + format(-ch, 0); }
  info = "**Стоимость покупки** = p × q = " + format(p, 0) + " × " + format(q, 0) + " = " + format(total, 0) + ". При оплате m = " + format(m, 0) + " " + cs + ".";
}
]
