[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float n = 8; string info = ""; float VMAX = 610;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 14; interactive = false; labels = false; color = #3b82f6 }
new UI { type = slider; label = "номер n"; variable = n; min = 2; max = 15; step = 1; default = 8 }
Function fib(k) { float a = 1; float b = 1; repeat (20) { if (i + 2 < k) { float t = a + b; a = b; b = t; } } if (k <= 2) { return 1; } return b; }
Update {
  g = newGraph();
  float step = 15.4 / n;
  repeat (n) { float k = i + 1; float v = fib(k); addNode(g, "a" + format(k,0), [-7.7 + step*(k-0.5), -4.5]); addNode(g, "b" + format(k,0), [-7.7 + step*(k-0.5), -4.5 + 8.5*v/VMAX]); addEdge(g, "a" + format(k,0), "b" + format(k,0)); }
  float f1 = fib(n); float f2 = fib(n - 1); float rat = 1; if (n > 2) { rat = f1 / f2; }
  info = "**Числа Фибоначчи:** F₁ = F₂ = 1, Fₙ = Fₙ₋₁ + Fₙ₋₂. При n = " + format(n,0) + ": Fₙ = " + format(f1,0) + ".\n\nОтношение Fₙ/Fₙ₋₁ = " + format(rat,4) + " приближается к золотому сечению φ ≈ 1.618 при росте n.";
}
]
