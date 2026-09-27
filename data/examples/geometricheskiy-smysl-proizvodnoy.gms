[
description = "{info}"
field width = 8; field height = 10;
camera type = fixed;
float x0 = 1.5; string info = "";
func f(x) = 0.3 * x * x;
Function tl(x) { float k = 0.6 * x0; return f(x0) + k * (x - x0); }
draw Function { name = "gf"; f = "f"; xmin = -4; xmax = 4; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gt"; f = "tl"; xmin = -4; xmax = 4; color = #f59e0b; thickness = 2 }
new Point { name = "R1"; pos = (1.5, 0.675); dynamic = false; collision = false; color = #22c55e; active = true }
new UI { type = slider; label = "точка касания x₀"; variable = x0; min = -4; max = 4; step = 0.1; default = 1.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  R1.pos.x = x0; R1.pos.y = f(x0);
  float k = 0.6 * x0;
  info = "**Геометрический смысл производной**: f′(x₀) — угловой коэффициент (наклон) касательной к графику f в точке касания x₀ (зелёная точка). Здесь x₀ = " + num(x0, 1) + ", значит наклон касательной (оранжевая линия) f′(" + num(x0, 1) + ") = " + num(k, 2) + ".";
}
]
