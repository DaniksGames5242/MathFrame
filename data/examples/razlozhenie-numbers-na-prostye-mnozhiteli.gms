[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float N = 60; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; color = #3b82f6; interactive = false; labels = false }
new UI { type = slider; label = "число N"; variable = N; min = 2; max = 200; step = 1; default = 60 }
Function md(a, b) { return a - b * floor(a / b); }
Function sup(e) { if (e == 2) { return "²"; } if (e == 3) { return "³"; } if (e == 4) { return "⁴"; } if (e == 5) { return "⁵"; } if (e == 6) { return "⁶"; } if (e == 7) { return "⁷"; } return "⁸"; }
Update {
  N = round(N);
  g = newGraph(); addNode(g, "a0", [-5, -3]); addNode(g, "a1", [-5 + 10 * N / 200, -3]); addEdge(g, "a0", "a1");
  string res = ""; float m = N; float p = 2;
  repeat (60) { if (p * p <= m) { float e = 0; repeat (30) { if (md(m, p) == 0) { m = m / p; e = e + 1; } } if (e > 0) { if (res != "") { res = res + " × "; } string ps = "" + format(p, 0); if (e > 1) { ps = ps + sup(e); } res = res + ps; } } p = p + 1; }
  if (m > 1) { if (res != "") { res = res + " × "; } res = res + format(m, 0); }
  info = "**Разложение на простые множители:** каждое натуральное число, большее 1, единственным образом раскладывается в произведение степеней простых чисел.\n\nN = " + format(N, 0) + " = **" + res + "**.";
}
]
