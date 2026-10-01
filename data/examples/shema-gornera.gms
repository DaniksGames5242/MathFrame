[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; string info = "";
func f(x) = 0.15*x*x*x - x + 1;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "x = a"; variable = a; min = -3; max = 3; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float b2 = 0.15; float b1 = b2 * a; float b0 = b1 * a - 1; float R = b0 * a + 1;
  R1.pos.x = a; R1.pos.y = R;
  info = "**Схема Горнера** для P(x) = 0,15x³ − x + 1 при x = " + num(a, 1) + ": b₂ = 0,15, b₁ = b₂·a = " + num(b1, 2) + ", b₀ = b₁·a − 1 = " + num(b0, 2) + ", P(a) = b₀·a + 1 = " + num(R, 2) + ".\n\nКаждый шаг — умножение на a и сложение со следующим коэффициентом; итог — значение многочлена в точке a (отмечено на графике).";
}
]
