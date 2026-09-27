[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 3; float x0 = 1; string info = "";
func f(x) = x;
func g(x) = x + a;
func h(x) = f(x) / g(x);
draw Function { name = "gh"; f = "h"; xmin = -10; xmax = 10; grid = true; color = #22c55e; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = 2; max = 8; step = 0.1; default = 3 }
new UI { type = slider; label = "точка x₀"; variable = x0; min = -1; max = 6; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float dh = (1 * g(x0) - f(x0) * 1) / (g(x0) * g(x0));
  info = "h(x) = x/(x + a) = f(x)/g(x), где f(x) = x, g(x) = x + a.\n\n**(f/g)' = (f'g − fg')/g²:** при a = " + format(a, 1) + ", x₀ = " + num(x0, 1) + " h'(x₀) = " + num(dh, 2) + ".";
}
]
