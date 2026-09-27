[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float n = 8; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 14; labels = false; interactive = false }
new UI { type = slider; label = "n"; variable = n; min = 1; max = 16; step = 1; default = 8 }
Update {
  g = newGraph(); float mx = log(num(partitionCount(16)) + 1);
  repeat (17) { float k = i + 1; if (k <= n) { float h = 7.5 * log(num(partitionCount(k)) + 1) / mx; string c = "#3b82f6"; if (k == n) { c = "#f59e0b"; }
    addNode(g, "a" + format(k, 0), [-7.6 + k * 0.95, -4.3]); addNode(g, "b" + format(k, 0), [-7.6 + k * 0.95, -4.3 + h]); addEdge(g, "a" + format(k, 0), "b" + format(k, 0), 1, c); } }
  info = "**Разбиение числа** n — способ представить n суммой натуральных слагаемых без учёта порядка (например, 4 = 3 + 1 = 2 + 2 = 2 + 1 + 1 = 1 + 1 + 1 + 1). p(n) — число таких разбиений.\n\nСтолбики (логарифмическая шкала) — p(1), …, p(n). При n = " + format(n, 0) + ": p(n) = " + format(partitionCount(n), 0) + ".";
}
]
