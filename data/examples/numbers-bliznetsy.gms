[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float M = 20; float n = 6; float key = -1; float key2 = -1; float npairs = 0; string plist = ""; string info = "";
new UI { type = slider; label = "столбцов"; variable = M; min = 5; max = 24; step = 1; default = 20 }
new UI { type = slider; label = "n"; variable = n; min = 1; max = M; step = 1; default = 6 }
draw Graph { name = "gT"; graph = "g1"; edgeColor = #f59e0b; edgeWidth = 5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gS"; graph = "g2"; nodeColor = #22c55e; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gK"; graph = "g3"; nodeColor = #3b82f6; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gF"; graph = "g4"; nodeColor = #3b82f655; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gH"; graph = "g5"; nodeColor = #f59e0b; nodeRadius = 17; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Text { name = "tp"; pos = (-7.8, 2.6); text = "6n + 1"; size = 0.9; align = left }
draw Text { name = "tm"; pos = (-7.8, 0); text = "6n"; size = 0.9; align = left }
draw Text { name = "tq"; pos = (-7.8, -2.6); text = "6n − 1"; size = 0.9; align = left }
Function md(x, y) { return x - y * floor(x / y); }
Function spf(m) { float d = 2; repeat (30) { if (d * d <= m && md(m, d) != 0) { d = d + 1; } } if (d * d > m) { return m; } return d; }
Function isp(m) { if (m < 2) { return 0; } if (spf(m) == m) { return 1; } return 0; }
Function cx(c) { return -6 + 12.6 * (c - 1) / 23; }
Function desc(m) { if (isp(m) == 1) { return format(m, 0) + " простое"; } return format(m, 0) + " = " + format(spf(m), 0) + " · " + format(m / spf(m), 0); }
Update {
  M = round(M); n = round(n);
  if (n > M) { n = M; }
  if (key != M) {
    g1 = newGraph(); g2 = newGraph(); g3 = newGraph(); g4 = newGraph();
    npairs = 1; plist = "(3; 5)";
    repeat (24) {
      float c = i + 1;
      if (c <= M) {
        float a = 6 * c - 1; float b = 6 * c + 1;
        string ka = "a" + format(c, 0); string kb = "b" + format(c, 0); string km = "m" + format(c, 0);
        addNode(g3, km, [cx(c), 0]);
        if (isp(a) == 1) { addNode(g2, ka, [cx(c), -2.6]); } else { addNode(g4, ka, [cx(c), -2.6]); }
        if (isp(b) == 1) { addNode(g2, kb, [cx(c), 2.6]); } else { addNode(g4, kb, [cx(c), 2.6]); }
        if (isp(a) == 1 && isp(b) == 1) { addNode(g1, ka, [cx(c), -2.6]); addNode(g1, kb, [cx(c), 2.6]); addEdge(g1, ka, kb); npairs = npairs + 1; plist = plist + ", (" + format(a, 0) + "; " + format(b, 0) + ")"; }
      }
    }
    key = M;
  }
  if (key2 != n) { g5 = newGraph(); addNode(g5, "h", [cx(n), 0]); key2 = n; }
  info = "**Числа-близнецы** — простые p и p + 2. Кроме пары (3; 5), все они имеют вид 6n − 1 и 6n + 1 (между ними стоит кратное шести число 6n). Зелёные точки — простые числа среди 6n ± 1, серые — составные; оранжевая связка — пара близнецов.\n\nДля 6n + 1 ≤ " + format(6 * M + 1, 0) + " пар близнецов **" + format(npairs, 0) + "**: " + plist + ".\n\nn = " + format(n, 0) + ": " + desc(6 * n - 1) + ", " + desc(6 * n + 1) + (isp(6 * n - 1) + isp(6 * n + 1) == 2 ? " — пара близнецов." : ".");
}
]
