[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float x = 1.57; string info = "";
func f(t) = sin(t);
draw Function { name = "gr"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (1.57, 1); graph = "gr"; t = 0.6; color = #f59e0b }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  x = P.pos.x;
  info = "**Синус числового аргумента:** sin x — ордината точки единичной окружности, отвечающей углу x радиан.\n\nsin(" + num(x, 2) + ") = " + num(sin(x), 3) + ". Функция периодична с периодом 2π и принимает значения от −1 до 1.";
}
]
