[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float N = 24; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; interactive = false; labels = false }
new UI { type = slider; label = "число N"; variable = N; min = 1; max = 200; step = 1; default = 24 }
Function md(a, b) { return a - b * floor(a / b); }
Function ds(n) { float s = 0; float m = n; repeat (4) { s = s + md(m, 10); m = floor(m / 10); } return s; }
Update {
  N = round(N);
  float s = ds(N);
  float ok = 0; if (md(s, 3) == 0) { ok = 1; }
  string c = "#3b82f6"; if (ok > 0.5) { c = "#22c55e"; }
  g = newGraph(); addNode(g, "a0", [-5, -3]); addNode(g, "a1", [-5 + 10 * N / 200, -3]); addEdge(g, "a0", "a1", 1, c);
  string res = "не делится"; if (ok > 0.5) { res = "делится"; }
  info = "**Признак делимости на 3:** число делится на 3 тогда и только тогда, когда сумма его цифр делится на 3.\n\nN = " + format(N, 0) + ", сумма цифр = " + format(s, 0) + " — N " + res + " на 3.";
}
]
