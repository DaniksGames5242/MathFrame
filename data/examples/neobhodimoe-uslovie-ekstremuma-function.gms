[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float p = 1; string info = "";
func f(x) = x * x * x - 3 * p * x;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = p > 0.02 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = p > 0.02 }
new UI { type = slider; label = "p"; variable = p; min = 0; max = 3; step = 0.05; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (p > 0.02) { float xc = sqrt(p); R1.pos.x = -xc; R1.pos.y = f(-xc); R2.pos.x = xc; R2.pos.y = f(xc);
    info = "**Необходимое условие экстремума**: если x₀ — точка экстремума дифференцируемой функции, то f′(x₀) = 0. Для y = x³ − 3px производная 3x² − 3p обращается в 0 при x = ±" + num(xc, 2) + " (оранжевые точки) — это точки экстремума."; }
  if (p <= 0.02) { info = "**Необходимое условие экстремума**: при p = 0 функция y = x³ монотонна, f′(x) = 3x² ≥ 0 не меняет знак — экстремумов нет, хотя f′(0) = 0. Условие необходимое, но не достаточное."; }
}
]
