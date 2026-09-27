[
description = "{info}"
field width = 20; field height = 6;
camera type = fixed;
func f(x) = 0;
draw Function { name = "ax"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 1 }
float x = 4; string info = "";
new Point { name = "P"; pos = (4, 0); dynamic = true; collision = false; color = #f59e0b }
new UI { type = slider; label = "x (перетащите точку P)"; variable = x; min = -10; max = 10; step = 0.5; default = 4 }
Update {
  if (abs(P.pos.x - x) > 0.001) { x = P.pos.x; } else { P.pos.x = x; }
  P.pos.y = 0;
  if (x > 0.001) { info = "**Точка P = " + format(x, 1) + "** — число положительное: лежит справа от нуля."; }
  if (x < -0.001) { info = "**Точка P = " + format(x, 1) + "** — число отрицательное: лежит слева от нуля."; }
  if (abs(x) < 0.001) { info = "**Точка P = 0** — ноль не относится ни к положительным, ни к отрицательным числам."; }
}
]
