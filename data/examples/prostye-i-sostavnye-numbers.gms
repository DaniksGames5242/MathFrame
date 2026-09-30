[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float n = 91; float key = -1; string info = "";
new UI { type = slider; label = "число n"; variable = n; min = 1; max = 100; step = 1; default = 91 }
draw Graph { name = "gH"; graph = "g0"; nodeColor = #f59e0b; nodeRadius = 24; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gP"; graph = "g1"; nodeColor = #22c55e; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gC"; graph = "g2"; nodeColor = #3b82f6; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gU"; graph = "g3"; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
Function md(x, y) { return x - y * floor(x / y); }
Function spf(m) { float d = 2; repeat (10) { if (d * d <= m && md(m, d) != 0) { d = d + 1; } } if (d * d > m) { return m; } return d; }
Function isp(m) { if (m < 2) { return 0; } if (spf(m) == m) { return 1; } return 0; }
Function gx(m) { return -6.9 + 1.5333 * md(m - 1, 10); }
Function gy(m) { return 4.3 - 0.95 * floor((m - 1) / 10); }
Update {
  n = round(n);
  if (key < 0) {
    g1 = newGraph(); g2 = newGraph(); g3 = newGraph();
    repeat (100) {
      float m = i + 1;
      if (m == 1) { addNode(g3, "1", [gx(m), gy(m)], "1"); }
      else { if (isp(m) == 1) { addNode(g1, format(m, 0), [gx(m), gy(m)], format(m, 0)); } else { addNode(g2, format(m, 0), [gx(m), gy(m)], format(m, 0)); } }
    }
    key = 0;
  }
  if (key != n + 1) {
    g0 = newGraph();
    addNode(g0, "s", [gx(n), gy(n)]);
    key = n + 1;
  }
  string dv = ""; float nd = 0;
  repeat (100) { float d = i + 1; if (d <= n && md(n, d) == 0) { nd = nd + 1; if (dv != "") { dv = dv + ", "; } dv = dv + format(d, 0); } }
  string tested = ""; float d2 = 2; float found = 0;
  repeat (10) { if (d2 * d2 <= n && found == 0) { if (isp(d2) == 1) { if (tested != "") { tested = tested + ", "; } tested = tested + format(d2, 0); if (md(n, d2) == 0) { found = d2; } } d2 = d2 + 1; } }
  info = "**Простые и составные числа.** Простое число (зелёное) имеет ровно два положительных делителя: 1 и само себя. Составное (синее) раскладывается в произведение двух сомножителей, каждый из которых больше 1. Число 1 не относится ни к простым, ни к составным.\n\n";
  if (n == 1) { info = info + "n = 1: единственный делитель 1 — ни простое, ни составное."; }
  else { if (isp(n) == 1) { info = info + "n = " + format(n, 0) + " — **простое**: делители " + dv + ". Достаточно проверить простые p ≤ √" + format(n, 0) + " ≈ " + format(sqrt(n), 1) + (tested == "" ? "" : ": " + tested) + " — ни одно не делит n."; }
    else { info = info + "n = " + format(n, 0) + " — **составное**: " + format(n, 0) + " = " + format(found, 0) + " · " + format(n / found, 0) + ", делители " + dv + ". Проверка простых p ≤ √" + format(n, 0) + " ≈ " + format(sqrt(n), 1) + ": " + tested + " — наименьший делитель " + format(found, 0) + "."; } }
  info = info + "\n\nОт 1 до 100: 25 простых, 74 составных и число 1.";
}
]
