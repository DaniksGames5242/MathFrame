[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float x0 = 1; string info = "";
func f(x) = x * x;
func g(x) = a * sin(x);
func h(x) = f(x) + g(x);
draw Function { name = "gf"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 2 }
draw Function { name = "gg"; f = "g"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 2 }
draw Function { name = "gh"; f = "h"; xmin = -10; xmax = 10; color = #22c55e; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = -2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "точка x₀"; variable = x0; min = -4; max = 4; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float df = 2 * x0; float dg = a * cos(x0); float dh = df + dg;
  info = "f(x) = x² (синий), g(x) = a·sin x (оранжевый), h(x) = f(x) + g(x) (зелёный).\n\n**(f + g)' = f' + g':** при x₀ = " + num(x0, 1) + " f'(x₀) = " + num(df, 2) + ", g'(x₀) = " + num(dg, 2) + ", h'(x₀) = " + num(dh, 2) + ".";
}
]
