[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float r = 0; string info = "";
func f(x) = (x - 1) / (x - 2);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "множитель r"; variable = r; min = -4; max = 5; step = 0.1; default = 0 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function mi(x, d) { if (x < 0) { return "+ " + format(-x, d); } return "− " + format(x, d); }
Update {
  if (abs(r - 2) < 0.15) { r = 2.15; }
  H.pos.x = r; H.pos.y = (r - 1) / (r - 2);
  info = "**Основное свойство:** (x − 1)/(x − 2) = [(x − 1)(x " + mi(r, 1) + ")] / [(x − 2)(x " + mi(r, 1) + ")] при x ≠ " + num(r, 1) + " — умножение числителя и знаменателя на один и тот же многочлен (x " + mi(r, 1) + ") не меняет значение дроби.\n\nОтмеченная точка вычислена по исходной дроби при x = " + num(r, 1) + " и лежит на том же графике.";
}
]
