[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float N = 347; string r = "10"; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.6); text = "число"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.6); text = "округление"; size = 0.9 }
new UI { type = slider; label = "число N"; variable = N; min = 0; max = 999; step = 1; default = 347 }
new UI { type = select; label = "разряд"; variable = r; options = ("10", "100"); labels = ("десятки", "сотни"); default = "10" }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 5.4 * v / 999]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float step = 10; if (r == "100") { step = 100; }
  float rv = round(N / step) * step;
  g = newGraph(); bar("a", -3, N, "#3b82f6"); bar("b", 3, rv, "#22c55e");
  info = "**" + format(N, 0) + "** округляется до " + r + " → **" + format(rv, 0) + "**: если цифра следующего младшего разряда 5 или больше — разряд увеличивается на 1, иначе остаётся без изменений.";
}
]
