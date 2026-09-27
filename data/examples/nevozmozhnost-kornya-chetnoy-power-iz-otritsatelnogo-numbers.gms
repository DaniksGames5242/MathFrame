[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
float x = -1.5; float n = 2; string info = "";
func f(t) = pow(t, n);
draw Function { name = "gr"; f = "f"; xmin = -6; xmax = 6; ymin = -5; ymax = 5; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "чётная степень n"; variable = n; min = 2; max = 6; step = 2; default = 2 }
new UI { type = slider; label = "x"; variable = x; min = -3; max = 3; step = 0.1; default = -1.5 }
Update {
  float y = pow(x, n); if (y > 5) { y = 5; }
  P1.pos.x = x; P1.pos.y = y;
  info = "y = xⁿ при чётном n = " + format(n, 0) + " всегда неотрицательно: при x = " + format(x, 1) + " получаем y = " + format(pow(x, n), 2) + ". Поэтому при чётном n уравнение xⁿ = a не имеет действительных решений, если a < 0 — корень чётной степени из отрицательного числа не существует.";
}
]
