[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
float p = 2; float eps = 0.2; string info = "";
func f(x) = 1 / pow(x, p);
draw Function { name = "gr"; f = "f"; xmin = 0.02; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "B"; pos = (0.2, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "показатель p"; variable = p; min = 0.2; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "нижний предел ε"; variable = eps; min = 0.01; max = 0.9; step = 0.01; default = 0.2 }
Update {
  if (abs(p - 1) < 0.05) { p = 1.06; }
  B.pos.x = eps; B.pos.y = min(f(eps), 4);
  float I = 0; float M = 300; float dx = (1 - eps) / M;
  repeat (300) { float x = eps + i * dx; I = I + (1 / pow(x, p)) * dx; }
  string tr = "площадь неограниченно растёт — интеграл расходится";
  if (p < 1) { tr = "площадь стремится к конечному пределу 1/(1 − " + format(p, 1) + ") = " + format(1 / (1 - p), 3) + " — интеграл сходится"; }
  info = "**Несобственный интеграл второго рода**: f(x) = x⁻ᵖ неограничена при x → 0⁺. ∫ x⁻ᵖ dx на [ε; 1] = " + format(I, 3) + " при ε = " + format(eps, 2) + ", p = " + format(p, 1) + ". При ε → 0⁺ для p = " + format(p, 1) + " " + tr + ".";
}
]
