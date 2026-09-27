[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k = 1; float N = 6; string info = "";
func f(x) = exp(-k * x);
draw Function { name = "gr"; f = "f"; xmin = 0; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "B"; pos = (6, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "коэффициент k"; variable = k; min = 0.1; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "верхний предел N"; variable = N; min = 1; max = 10; step = 0.5; default = 6 }
Update {
  if (k < 0.05) { k = 0.05; }
  B.pos.x = N; B.pos.y = f(N);
  float I = 0; float M = 300; float dx = N / M;
  repeat (300) { float x = i * dx; I = I + exp(-k * x) * dx; }
  info = "**Несобственный интеграл первого рода** (по бесконечному промежутку): ∫ e⁻ᵏˣ dx на [0; N] = " + format(I, 3) + " при N = " + format(N, 1) + ", k = " + format(k, 1) + ". При N → ∞ площадь стремится к конечному пределу ∫ e⁻ᵏˣ dx на [0; ∞) = 1/k = " + format(1 / k, 3) + " — интеграл сходится для любого k > 0.";
}
]
