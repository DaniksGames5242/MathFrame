[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float x0 = 1; string info = "";
func f(x) = x;
func g(x) = cos(x);
func h(x) = f(x) * g(x);
draw Function { name = "gf"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 2 }
draw Function { name = "gg"; f = "g"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 2 }
draw Function { name = "gh"; f = "h"; xmin = -10; xmax = 10; color = #22c55e; thickness = 3 }
new UI { type = slider; label = "точка x₀"; variable = x0; min = -4; max = 4; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float dh = 1 * g(x0) + f(x0) * (-sin(x0));
  info = "f(x) = x (синий), g(x) = cos x (оранжевый), h(x) = f(x)·g(x) (зелёный).\n\n**(fg)' = f'g + fg':** при x₀ = " + num(x0, 1) + " h'(x₀) = 1·cos x₀ + x₀·(−sin x₀) = " + num(dh, 2) + ".";
}
]
