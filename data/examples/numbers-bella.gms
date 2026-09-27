[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float n = 5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 16; labels = false; interactive = false }
new UI { type = slider; label = "n"; variable = n; min = 0; max = 8; step = 1; default = 5 }
Update {
  g = newGraph(); float mx = log(num(bell(8)) + 1);
  repeat (9) { float k = i; if (k <= n) { float h = 7.5 * log(num(bell(k)) + 1) / mx; string c = "#3b82f6"; if (k == n) { c = "#f59e0b"; }
    addNode(g, "a" + format(k, 0), [-7 + k * 1.75, -4.3]); addNode(g, "b" + format(k, 0), [-7 + k * 1.75, -4.3 + h]); addEdge(g, "a" + format(k, 0), "b" + format(k, 0), 1, c); } }
  info = "**Число Белла** Bₙ — общее количество разбиений n-элементного множества на непустые непересекающиеся подмножества (сумма чисел Стирлинга второго рода S(n, k) по всем k).\n\nСтолбики (логарифмическая шкала) — B₀, …, Bₙ. При n = " + format(n, 0) + ": Bₙ = " + format(bell(n), 0) + ".";
}
]
