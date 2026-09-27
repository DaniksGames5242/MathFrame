[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
float c = 1; string info = "";
func F(x) = x * x + c;
draw Function { name = "gF"; f = "F"; xmin = -6; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "константа C"; variable = c; min = -4; max = 4; step = 0.5; default = 1 }
Function num(v, d) { if (v < 0) { return "− " + format(-v, d); } return "+ " + format(v, d); }
Update {
  info = "**Неопределённый интеграл** ∫2x dx = x² + C — множество всех первообразных функции f(x) = 2x.\n\nПри C = " + format(c, 1) + " график: y = x² " + num(c, 1) + ". Все графики семейства получаются друг из друга сдвигом по вертикали и в каждой точке x имеют один и тот же наклон, так как их производная одна и та же — 2x.";
}
]
