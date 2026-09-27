[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float x0 = 1; string info = "";
func g(x) = x * x;
func h(x) = sin(g(x));
draw Function { name = "gh"; f = "h"; xmin = -6; xmax = 6; segments = 3000; grid = true; color = #22c55e; thickness = 3 }
new UI { type = slider; label = "точка x₀"; variable = x0; min = -2.5; max = 2.5; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float u = g(x0);
  float dh = cos(u) * (2 * x0);
  info = "h(x) = sin(x²) — сложная функция: внешняя f(u) = sin u, внутренняя u = g(x) = x².\n\n**Цепное правило:** h'(x) = f'(g(x))·g'(x) = cos(x²)·2x. При x₀ = " + num(x0, 1) + " h'(x₀) = cos(" + num(u, 2) + ")·" + num(2 * x0, 1) + " = " + num(dh, 2) + ".";
}
]
