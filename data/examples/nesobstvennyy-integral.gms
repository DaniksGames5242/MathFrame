[
description = "{info}"
field width = 22; field height = 12;
camera type = fixed;
float p = 2; float N = 8; string info = "";
func f(x) = 1 / pow(x, p);
draw Function { name = "gr"; f = "f"; xmin = 0.05; xmax = 11; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "B"; pos = (8, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "показатель p"; variable = p; min = 0.2; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "верхний предел N"; variable = N; min = 2; max = 10; step = 0.5; default = 8 }
Update {
  if (abs(p - 1) < 0.05) { p = 1.06; }
  B.pos.x = N; B.pos.y = min(f(N), 5);
  float I = 0; float M = 300; float dx = (N - 1) / M;
  repeat (300) { float x = 1 + i * dx; I = I + (1 / pow(x, p)) * dx; }
  string tr = "площадь неограниченно растёт — интеграл расходится";
  if (p > 1) { tr = "площадь стремится к конечному пределу 1/(" + format(p - 1, 1) + ") = " + format(1 / (p - 1), 3) + " — интеграл сходится"; }
  info = "**Несобственный интеграл**: ∫ x⁻ᵖ dx на [1; N] = " + format(I, 3) + " при N = " + format(N, 1) + ", p = " + format(p, 1) + ". Несобственный интеграл ∫ x⁻ᵖ dx на [1; ∞) определяется как предел этой площади при N → ∞: при p = " + format(p, 1) + " " + tr + ".";
}
]
