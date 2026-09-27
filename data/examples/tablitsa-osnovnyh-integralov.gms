[
description = "{info}"
field width = 5.6; field height = 12;
camera type = fixed;
float n = 0.5; string info = "";
func f(x) = pow(x, n);
func F(x) = pow(x, n + 1) / (n + 1);
draw Function { name = "gf"; f = "f"; xmin = 0.001; xmax = 2.8; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gF"; f = "F"; xmin = 0.001; xmax = 2.8; color = #f59e0b; thickness = 3 }
new UI { type = slider; label = "показатель n"; variable = n; min = 0.3; max = 1.5; step = 0.1; default = 0.5 }
Update {
  info = "**Табличный интеграл степенной функции:** ∫xⁿdx = xⁿ⁺¹/(n + 1) + C (при n ≠ −1, x > 0).\n\nПри n = " + format(n, 1) + ": синий график — f(x) = xⁿ, оранжевый — первообразная F(x) = xⁿ⁺¹/(n + 1).";
}
]
