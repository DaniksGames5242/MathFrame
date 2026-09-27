[
description = "{info}"
field width = 12; field height = 14;
camera type = fixed;
float x0 = 3; string info = "";
func f(x) = x * sin(x);
func F(x) = sin(x) - x * cos(x);
draw Function { name = "gf"; f = "f"; xmin = -6; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gF"; f = "F"; xmin = -6; xmax = 6; color = #f59e0b; thickness = 3 }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "tg"; pos = (T1, T2); color = #22c55e }
new UI { type = slider; label = "x₀"; variable = x0; min = -5.5; max = 5.5; step = 0.1; default = 3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  T1.pos.x = x0 - 0.8; T1.pos.y = F(x0) - 0.8 * f(x0);
  T2.pos.x = x0 + 0.8; T2.pos.y = F(x0) + 0.8 * f(x0);
  info = "**Интегрирование по частям:** в ∫x·sin x dx берём u = x, dv = sin x dx, тогда du = dx, v = −cos x. По формуле ∫u dv = uv − ∫v du получаем ∫x·sin x dx = −x·cos x + sin x + C.\n\nСиний — f(x) = x·sin x, оранжевый — первообразная F(x) = sin x − x·cos x. Зелёная касательная к F в x₀ = " + num(x0, 2) + " имеет наклон F′(x₀) = " + num(f(x0), 2) + " = f(x₀).";
}
]
