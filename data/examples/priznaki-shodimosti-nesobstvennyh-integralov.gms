[
description = "{info}"
field width = 22; field height = 12;
camera type = fixed;
float p = 2; float N = 8; string info = "";
func f(x) = 1 / (pow(x, p) + x);
func g(x) = 1 / pow(x, p);
draw Function { name = "gg"; f = "g"; xmin = 0.1; xmax = 11; grid = true; color = #f59e0b; thickness = 2 }
draw Function { name = "gf"; f = "f"; xmin = 0.1; xmax = 11; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "показатель p"; variable = p; min = 0.2; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "верхний предел N"; variable = N; min = 2; max = 11; step = 0.5; default = 8 }
Update {
  float If = 0; float Ig = 0; float M = 300; float dx = (N - 1) / M;
  repeat (300) { float x = 1 + i * dx; If = If + f(x) * dx; Ig = Ig + g(x) * dx; }
  string tail = "здесь p ≤ 1: ∫g расходится, признак сравнения в эту сторону не применим, но численно видно, что и ∫f растёт без предела.";
  if (p > 1) { tail = "здесь p > 1: ∫g сходится, а так как 0 ≤ f(x) ≤ g(x) при x ≥ 1, то по признаку сравнения ∫f тоже сходится."; }
  info = "**Признак сравнения**: 0 ≤ f(x) ≤ g(x) при x ≥ 1, где g(x) = x⁻ᵖ, f(x) = 1/(xᵖ + x). При N = " + format(N, 1) + ", p = " + format(p, 1) + ": ∫f dx на [1; N] = " + format(If, 3) + ", ∫g dx на [1; N] = " + format(Ig, 3) + ". " + tail;
}
]
