[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float N = 1234; string info = "";
draw Graph { name = "gb"; graph = "grph"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "сумма цифр N"; size = 0.85 }
draw Text { name = "l2"; pos = (3, -3.5); text = "цифровой корень"; size = 0.85 }
new UI { type = slider; label = "N"; variable = N; min = 1; max = 9999; step = 1; default = 1234 }
Function digitsum(n) { float t = 0; float m = n; repeat (6) { if (m >= 1) { t = t + (m - 10 * floor(m / 10)); m = floor(m / 10); } } return t; }
Update {
  grph = newGraph();
  float s1 = digitsum(N); float d = digitsum(s1);
  addNode(grph, "a0", [-3, -3]); addNode(grph, "a1", [-3, -3 + 6 * s1 / 36]); addEdge(grph, "a0", "a1", 1, "#3b82f6");
  addNode(grph, "b0", [3, -3]); addNode(grph, "b1", [3, -3 + 6 * d / 9]); addEdge(grph, "b0", "b1", 1, "#f59e0b");
  info = "**Цифровой корень числа** N = " + format(N, 0) + " получается повторным суммированием его цифр до однозначного числа: сумма цифр N = " + format(s1, 0) + ", а её цифровой корень = " + format(d, 0) + ".\n\nОн совпадает с остатком от деления N на 9, а если N делится на 9 без остатка — равен 9.";
}
]
