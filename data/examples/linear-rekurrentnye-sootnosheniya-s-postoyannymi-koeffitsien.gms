[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float p = 1; float q = 1; float n = 7; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 16; labels = false; interactive = false }
new UI { type = slider; label = "p"; variable = p; min = -2; max = 2; step = 0.5; default = 1 }
new UI { type = slider; label = "q"; variable = q; min = -2; max = 2; step = 0.5; default = 1 }
new UI { type = slider; label = "номер n"; variable = n; min = 2; max = 9; step = 1; default = 7 }
Update {
  list s = [0]; push(s, 0); push(s, 1);
  repeat (8) { push(s, p * s[len(s) - 1] + q * s[len(s) - 2]); }
  float mx = 0.1; repeat (11) { mx = max(mx, abs(s[i])); }
  g = newGraph();
  repeat (9) { float k = i; if (k >= 1 && k <= n) { string c = "#3b82f6"; if (k == n) { c = "#f59e0b"; }
    addNode(g, "a" + format(k, 0), [-7 + k * 1.6, -4.3]); addNode(g, "b" + format(k, 0), [-7 + k * 1.6, -4.3 + 6 * s[k] / mx]); addEdge(g, "a" + format(k, 0), "b" + format(k, 0), 1, c); } }
  info = "**Линейное рекуррентное соотношение с постоянными коэффициентами**: aₙ = p·aₙ₋₁ + q·aₙ₋₂ — при a₁ = 0, a₂ = 1 и p = q = 1 это числа Фибоначчи.\n\nПри p = " + format(p, 1) + ", q = " + format(q, 1) + ": aₙ = " + format(s[n], 1) + " при n = " + format(n, 0) + ".";
}
]
