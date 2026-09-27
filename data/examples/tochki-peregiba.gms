[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float x0 = 1; string info = "";
func f(x) = x * x * x - 3 * x;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "I"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "x₀"; variable = x0; min = -3; max = 3; step = 0.05; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  P.pos.x = x0; P.pos.y = f(x0);
  float d2 = 6 * x0;
  string m = "выпуклость вниз"; if (d2 < 0) { m = "выпуклость вверх"; }
  info = "**Точка перегиба** — точка, где вторая производная меняет знак. У функции y = x³ − 3x f″(x) = 6x меняет знак в x = 0 (зелёная точка I) — это точка перегиба.\n\nПри x₀ = " + num(x0, 2) + " f″ = " + num(d2, 2) + " — " + m + ".";
}
]
