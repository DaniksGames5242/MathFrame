[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float n = 5; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 16; labels = false; interactive = false }
new UI { type = slider; label = "n"; variable = n; min = 0; max = 8; step = 1; default = 5 }
Update {
  g = newGraph(); float mx = log(num(catalan(8)) + 1);
  repeat (9) { float k = i; if (k <= n) { float h = 7.5 * log(num(catalan(k)) + 1) / mx; string c = "#3b82f6"; if (k == n) { c = "#f59e0b"; }
    addNode(g, "a" + format(k, 0), [-7 + k * 1.75, -4.3]); addNode(g, "b" + format(k, 0), [-7 + k * 1.75, -4.3 + h]); addEdge(g, "a" + format(k, 0), "b" + format(k, 0), 1, c); } }
  info = "**Число Каталана** Cₙ = C(2n, n)/(n + 1) — например, число правильных последовательностей из n открывающих и n закрывающих скобок.\n\nСтолбики (высота по логарифмической шкале) — C₀, C₁, …, Cₙ. При n = " + format(n, 0) + ": Cₙ = " + format(catalan(n), 0) + ".";
}
]
