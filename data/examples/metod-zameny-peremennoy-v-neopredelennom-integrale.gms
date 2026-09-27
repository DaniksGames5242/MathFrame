[
description = "{info}"
field width = 5; field height = 12;
camera type = fixed;
float x0 = 1.5; string info = "";
func f(x) = 2 * x * cos(x * x);
func F(x) = sin(x * x);
draw Function { name = "gf"; f = "f"; xmin = -2.5; xmax = 2.5; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gF"; f = "F"; xmin = -2.5; xmax = 2.5; color = #f59e0b; thickness = 3 }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "tg"; pos = (T1, T2); color = #22c55e }
new UI { type = slider; label = "x₀"; variable = x0; min = -2.2; max = 2.2; step = 0.1; default = 1.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  T1.pos.x = x0 - 0.4; T1.pos.y = F(x0) - 0.4 * f(x0);
  T2.pos.x = x0 + 0.4; T2.pos.y = F(x0) + 0.4 * f(x0);
  info = "**Метод замены переменной:** в ∫2x·cos(x²)dx подстановка u = x² даёт du = 2x dx, и интеграл сводится к ∫cos u du = sin u + C, то есть F(x) = sin(x²) + C.\n\nСиний график — f(x) = 2x·cos(x²), оранжевый — первообразная F(x) = sin(x²). Зелёный отрезок — касательная к F в точке x₀ = " + num(x0, 2) + "; её наклон F′(x₀) = " + num(f(x0), 2) + " равен значению f(x₀).";
}
]
