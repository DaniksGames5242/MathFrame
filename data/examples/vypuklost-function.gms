[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float x0 = 1; string info = "";
func f(x) = x * x * x - 3 * x;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "x₀"; variable = x0; min = -3; max = 3; step = 0.05; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  P.pos.x = x0; P.pos.y = f(x0);
  float d2 = 6 * x0;
  string m = "выпукла вниз (график лежит выше касательных)"; if (d2 < 0) { m = "выпукла вверх (график лежит ниже касательных)"; }
  info = "**Выпуклость функции**: знак второй производной f″(x) = 6x определяет направление выпуклости. При x₀ = " + num(x0, 2) + " f″ = " + num(d2, 2) + " — функция здесь " + m + ".\n\nПри x > 0 функция выпукла вниз, при x < 0 — выпукла вверх.";
}
]
