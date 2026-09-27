[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a = -8; string info = "";
func f(x) = cbrt(x);
draw Function { name = "gr"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (-8, -2); dynamic = false; collision = false; color = #f59e0b; active = true }
new UI { type = slider; label = "a"; variable = a; min = -8; max = 8; step = 0.5; default = -8 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float r = cbrt(a);
  P.pos.x = a; P.pos.y = r;
  info = "**Корень нечётной степени (n = 3) из числа a = " + num(a, 1) + ":** ∛a = " + num(r, 2) + ", так как (" + num(r, 2) + ")³ = " + num(a, 1) + ".\n\nВ отличие от корня чётной степени, корень нечётной степени существует для любого действительного числа и сохраняет его знак.";
}
]
