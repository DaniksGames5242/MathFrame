[
description = "{info}"
field width = 40; field height = 8;
camera type = fixed;
float n = 5; string info = "";
func f(x) = pow(1 + 1 / x, x);
draw Function { name = "gr"; f = "f"; xmin = 0.001; xmax = 20; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "x"; variable = n; min = 0.1; max = 20; step = 0.1; default = 5 }
Update {
  float v = pow(1 + 1 / n, n);
  P.pos.x = n; P.pos.y = v;
  info = "**Второй замечательный предел:** lim(x→∞) (1 + 1/x)ˣ = e ≈ 2.71828.\n\nПри x = " + format(n, 1) + ": (1 + 1/x)ˣ = " + format(v, 4) + ". С ростом x значение приближается к e.";
}
]
