[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float t = 1; string info = "";
func f(x) = x;
func g(x) = sin(x);
draw Function { name = "gf"; f = "f"; xmin = -6; xmax = 6; grid = true; color = #f59e0b; thickness = 2 }
draw Function { name = "gg"; f = "g"; xmin = -6; xmax = 6; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "x"; variable = t; min = -3; max = 3; step = 0.02; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(t) < 0.02) { t = 0.02; }
  float r = sin(t) / t;
  info = "**Эквивалентные бесконечно малые:** при x → 0 sin x ~ x, так как lim(x→0) sin x / x = 1. Оранжевый график x, синий sin x — они почти совпадают около 0.\n\nПри x = " + num(t, 2) + ": sin x / x = " + format(r, 4) + ".";
}
]
