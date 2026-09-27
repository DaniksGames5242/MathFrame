[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float x0 = -3; string info = "";
func f(x) = x / (x * x + 1);
func F(x) = 0.5 * log(x * x + 1);
draw Function { name = "gf"; f = "f"; xmin = -6; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gF"; f = "F"; xmin = -6; xmax = 6; color = #f59e0b; thickness = 3 }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "tg"; pos = (T1, T2); color = #22c55e }
new UI { type = slider; label = "x₀"; variable = x0; min = -5.5; max = 5.5; step = 0.1; default = -3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  T1.pos.x = x0 - 1; T1.pos.y = F(x0) - 1 * f(x0);
  T2.pos.x = x0 + 1; T2.pos.y = F(x0) + 1 * f(x0);
  info = "**Интегрирование рациональной функции:** в ∫x/(x² + 1)dx подстановка u = x² + 1, du = 2x dx сводит интеграл к (1/2)∫du/u = (1/2)ln|u| + C, то есть F(x) = (1/2)ln(x² + 1) + C.\n\nСиний — f(x) = x/(x² + 1), оранжевый — F(x). Наклон зелёной касательной к F в x₀ = " + num(x0, 2) + " равен F′(x₀) = " + num(f(x0), 3) + " = f(x₀).";
}
]
