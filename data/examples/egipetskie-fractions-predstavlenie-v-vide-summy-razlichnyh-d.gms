[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float p = 2; float q = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "числитель p"; variable = p; min = 2; max = 9; step = 1; default = 2 }
new UI { type = slider; label = "знаменатель q"; variable = q; min = 3; max = 12; step = 1; default = 3 }
Function ceilDiv(x, y) { return -floor(-x / y); }
Function bar(i, v, c2) { addNode(g, "n" + format(i, 0), [i * 2 - 5, -3]); addNode(g, "m" + format(i, 0), [i * 2 - 5, -3 + 6 * v]); addEdge(g, "n" + format(i, 0), "m" + format(i, 0), 1, c2); }
Update {
  if (p >= q) { p = q - 1; }
  float rn = p; float rd = q; string terms = ""; float cnt = 0; float mx = p / q;
  g = newGraph();
  repeat (4) {
    if (rn > 0.5) {
      float d = ceilDiv(rd, rn);
      if (cnt > 0.5) { terms = terms + " + "; }
      terms = terms + "1/" + format(d, 0);
      bar(cnt, (1 / d) / mx, "#3b82f6");
      rn = rn * d - rd; rd = rd * d; cnt = cnt + 1;
    }
  }
  info = "**Египетское представление** дроби " + format(p, 0) + "/" + format(q, 0) + " (жадный алгоритм): " + format(p, 0) + "/" + format(q, 0) + " = " + terms + ".\n\nКаждое слагаемое — единичная доля 1/n, все доли разные.";
}
]
