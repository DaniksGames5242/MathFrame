[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float N = 50; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; interactive = false; labels = false }
new UI { type = slider; label = "число N"; variable = N; min = 1; max = 400; step = 1; default = 50 }
Function md(a, b) { return a - b * floor(a / b); }
Update {
  N = round(N);
  float last2 = md(N, 100);
  float ok = 0; if (md(N, 25) == 0) { ok = 1; }
  string c = "#3b82f6"; if (ok > 0.5) { c = "#22c55e"; }
  g = newGraph(); addNode(g, "a0", [-5, -3]); addNode(g, "a1", [-5 + 10 * N / 400, -3]); addEdge(g, "a0", "a1", 1, c);
  string res = "не делится"; if (ok > 0.5) { res = "делится"; }
  info = "**Признак делимости на 25:** число делится на 25 тогда и только тогда, когда число, образованное его двумя последними цифрами, делится на 25.\n\nN = " + format(N, 0) + ", последние две цифры = " + format(last2, 0) + " — N " + res + " на 25.";
}
]
