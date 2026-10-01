[
description = "{info}"
field width = 8; field height = 10;
camera type = fixed;
float x0 = 1; float h = 1.5; string info = "";
func f(x) = 0.3 * x * x;
Function sec(x) { float k = (f(x0 + h) - f(x0)) / h; return f(x0) + k * (x - x0); }
draw Function { name = "gf"; f = "f"; xmin = -4; xmax = 4; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gs"; f = "sec"; xmin = -4; xmax = 4; color = #f59e0b; thickness = 2 }
new Point { name = "R1"; pos = (1, 0.3); dynamic = false; collision = false; color = #22c55e; active = true }
new Point { name = "R2"; pos = (2.5, 1.875); dynamic = false; collision = false; color = #22c55e; active = true }
new UI { type = slider; label = "приращение h"; variable = h; min = -3; max = 3; step = 0.05; default = 1.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(h) < 0.05) { h = 0.05; }
  R1.pos.x = x0; R1.pos.y = f(x0);
  R2.pos.x = x0 + h; R2.pos.y = f(x0 + h);
  float k = (f(x0 + h) - f(x0)) / h;
  info = "**Определение производной**: f′(x₀) = lim (f(x₀ + h) − f(x₀)) / h при h → 0. Секущая (оранжевая) проходит через точки x₀ = 1 и x₀ + h = " + num(x0 + h, 2) + ", разностное отношение = " + num(k, 3) + ". Чем меньше |h|, тем ближе секущая к касательной, а отношение — к точному значению f′(1) = 0,6.";
}
]
