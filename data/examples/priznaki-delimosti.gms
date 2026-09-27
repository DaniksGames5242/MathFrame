[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float N = 90; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; color = #3b82f6; interactive = false; labels = false }
new UI { type = slider; label = "число N"; variable = N; min = 1; max = 300; step = 1; default = 90 }
Function md(a, b) { return a - b * floor(a / b); }
Function ds(n) { float s = 0; float m = n; repeat (4) { s = s + md(m, 10); m = floor(m / 10); } return s; }
Function yn(v) { if (v) { return "да"; } return "нет"; }
Update {
  N = round(N);
  float s = ds(N); float last = md(N, 10); float last2 = md(N, 100);
  g = newGraph(); addNode(g, "a0", [-5, -3]); addNode(g, "a1", [-5 + 10 * N / 300, -3]); addEdge(g, "a0", "a1");
  info = "**Признаки делимости** — правила по цифрам числа, без деления «в столбик».\n\nN = " + format(N, 0) + ", последняя цифра " + format(last, 0) + ", сумма цифр " + format(s, 0) + ".\n\nделится на 2 — " + yn(md(last, 2) == 0) + "; на 3 — " + yn(md(s, 3) == 0) + "; на 5 — " + yn(md(last, 5) == 0) + "; на 9 — " + yn(md(s, 9) == 0) + "; на 10 — " + yn(last == 0) + ".";
}
]
