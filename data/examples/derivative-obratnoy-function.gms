[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float x0 = 1; string info = "";
func f(x) = x * x * x + x;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (1, 2); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "точка x₀"; variable = x0; min = -2; max = 2; step = 0.05; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  P.pos.x = x0; P.pos.y = f(x0);
  float fp = 3 * x0 * x0 + 1;
  float invd = 1 / fp;
  info = "f(x) = x³ + x монотонно возрастает, значит обратима. В точке x₀ = " + num(x0, 1) + " y₀ = f(x₀) = " + num(f(x0), 2) + ", f'(x₀) = " + num(fp, 2) + ".\n\n**(f⁻¹)'(y₀) = 1/f'(x₀) = " + num(invd, 3) + "**: график обратной функции — отражение синего графика относительно прямой y = x, и его наклон в точке (y₀; x₀) равен обратной величине наклона f в (x₀; y₀).";
}
]
