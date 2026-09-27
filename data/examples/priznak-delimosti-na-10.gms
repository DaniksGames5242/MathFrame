[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float N = 24; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; interactive = false; labels = false }
new UI { type = slider; label = "число N"; variable = N; min = 1; max = 200; step = 1; default = 24 }
Function md(a, b) { return a - b * floor(a / b); }
Update {
  N = round(N);
  float last = md(N, 10);
  float ok = 0; if (last == 0) { ok = 1; }
  string c = "#3b82f6"; if (ok > 0.5) { c = "#22c55e"; }
  g = newGraph(); addNode(g, "a0", [-5, -3]); addNode(g, "a1", [-5 + 10 * N / 200, -3]); addEdge(g, "a0", "a1", 1, c);
  string res = "не делится"; if (ok > 0.5) { res = "делится"; }
  info = "**Признак делимости на 10:** число делится на 10 тогда и только тогда, когда его последняя цифра равна 0.\n\nN = " + format(N, 0) + ", последняя цифра " + format(last, 0) + " — N " + res + " на 10.";
}
]
