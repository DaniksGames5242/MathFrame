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
  float ok2 = 0; if (md(N, 2) == 0) { ok2 = 1; }
  float ok3 = 0; if (md(ds(N), 3) == 0) { ok3 = 1; }
  float ok = 0; if (ok2 > 0.5) { if (ok3 > 0.5) { ok = 1; } }
  string c = "#3b82f6"; if (ok > 0.5) { c = "#22c55e"; }
  g = newGraph(); addNode(g, "a0", [-5, -3]); addNode(g, "a1", [-5 + 10 * N / 200, -3]); addEdge(g, "a0", "a1", 1, c);
  string r2 = "нет"; if (ok2 > 0.5) { r2 = "да"; } string r3 = "нет"; if (ok3 > 0.5) { r3 = "да"; }
  string res = "не делится"; if (ok > 0.5) { res = "делится"; }
  info = "**Признак делимости на 6:** число делится на 6 тогда и только тогда, когда оно делится и на 2, и на 3.\n\nN = " + format(N, 0) + ": на 2 — " + r2 + ", на 3 — " + r3 + " ⇒ N " + res + " на 6.";
}
]
