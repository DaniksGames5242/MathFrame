[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a0 = 2; float d = 3; float n = 6; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 16; labels = false; interactive = false }
new UI { type = slider; label = "a₁"; variable = a0; min = -5; max = 5; step = 0.5; default = 2 }
new UI { type = slider; label = "шаг d"; variable = d; min = -3; max = 3; step = 0.5; default = 3 }
new UI { type = slider; label = "номер n"; variable = n; min = 1; max = 9; step = 1; default = 6 }
Update {
  g = newGraph(); float mx = abs(a0) + abs(d) * 9 + 0.1; float v = a0;
  repeat (9) { float k = i + 1; if (k > 1) { v = v + d; } if (k <= n) { string c = "#3b82f6"; if (k == n) { c = "#f59e0b"; }
    addNode(g, "a" + format(k, 0), [-7 + k * 1.6, -4.3]); addNode(g, "b" + format(k, 0), [-7 + k * 1.6, -4.3 + 6 * v / mx]); addEdge(g, "a" + format(k, 0), "b" + format(k, 0), 1, c); } }
  info = "**Рекуррентное соотношение** задаёт каждый член последовательности через предыдущие: aₙ = aₙ₋₁ + d — здесь каждый следующий член получается из предыдущего по одному и тому же правилу.\n\nПри a₁ = " + format(a0, 1) + " и d = " + format(d, 1) + ": aₙ = a₁ + (n − 1)d, aₙ = " + format(v, 1) + " при n = " + format(n, 0) + ".";
}
]
