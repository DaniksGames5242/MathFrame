[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
float x0 = 2; string info = "";
func f(x) = sin(x) * sin(x);
func F(x) = x / 2 - sin(2 * x) / 4;
draw Function { name = "gf"; f = "f"; xmin = -6; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gF"; f = "F"; xmin = -6; xmax = 6; color = #f59e0b; thickness = 3 }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "tg"; pos = (T1, T2); color = #22c55e }
new UI { type = slider; label = "x₀"; variable = x0; min = -5.5; max = 5.5; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  T1.pos.x = x0 - 0.8; T1.pos.y = F(x0) - 0.8 * f(x0);
  T2.pos.x = x0 + 0.8; T2.pos.y = F(x0) + 0.8 * f(x0);
  info = "**Интегрирование тригонометрических функций:** по формуле понижения степени sin²x = (1 − cos 2x)/2, поэтому ∫sin²x dx = x/2 − sin(2x)/4 + C.\n\nСиний — f(x) = sin²x, оранжевый — первообразная F(x) = x/2 − sin(2x)/4. Наклон зелёной касательной к F в x₀ = " + num(x0, 2) + " равен F′(x₀) = " + num(f(x0), 2) + " = f(x₀).";
}
]
