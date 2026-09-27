[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float x0 = 0; string info = "";
func f(x) = x * x * x - 3 * x;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "Pmax"; pos = (-1, 2); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "Pmin"; pos = (1, -2); dynamic = false; collision = false; color = #22c55e }
new UI { type = slider; label = "проба x₀"; variable = x0; min = -3; max = 3; step = 0.05; default = 0 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float dp = 3 * x0 * x0 - 3; float d2 = 6 * x0;
  string s1 = "f′ > 0"; if (dp < 0) { s1 = "f′ < 0"; }
  info = "**Достаточное условие экстремума**: у функции y = x³ − 3x критические точки x = ±1 (f′ = 0). В x = −1 f″ = −6 < 0 — максимум (оранжевая точка); в x = 1 f″ = 6 > 0 — минимум (зелёная точка).\n\nВ пробной точке x₀ = " + num(x0, 2) + ": " + s1 + " (f′ = " + num(dp, 2) + "), f″(x₀) = " + num(d2, 2) + ".";
}
]
