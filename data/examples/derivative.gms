[
description = "{info}"
field width = 8; field height = 12;
camera type = fixed;
float x0 = 1; string info = "";
func f(x) = 0.3 * x * x;
func g(x) = 0.6 * x;
draw Function { name = "gf"; f = "f"; xmin = -4; xmax = 4; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gg"; f = "g"; xmin = -4; xmax = 4; color = #f59e0b; thickness = 3 }
new Point { name = "R1"; pos = (1, 0.3); dynamic = false; collision = false; color = #22c55e; active = true }
new UI { type = slider; label = "точка x₀"; variable = x0; min = -4; max = 4; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  R1.pos.x = x0; R1.pos.y = 0.3 * x0 * x0;
  info = "**Производная** f′ показывает скорость изменения f в каждой точке. Синий — y = f(x) = 0.3x², оранжевый — y = f′(x) = 0.6x. В точке x₀ = " + num(x0, 1) + " значение f′(" + num(x0, 1) + ") = " + num(0.6 * x0, 2) + " — это наклон касательной к синему графику в отмеченной точке (зелёная).";
}
]
