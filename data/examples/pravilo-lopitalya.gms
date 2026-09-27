[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float t = 1; string info = "";
func f(x) = (exp(x) - 1) / x;
func g(x) = exp(x);
draw Function { name = "gf1"; f = "f"; xmin = -6; xmax = -0.05; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gf2"; f = "f"; xmin = 0.05; xmax = 6; color = #3b82f6; thickness = 3 }
draw Function { name = "gg"; f = "g"; xmin = -6; xmax = 6; color = #f59e0b; thickness = 2 }
new UI { type = slider; label = "x"; variable = t; min = -4; max = 4; step = 0.02; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(t) < 0.02) { t = 0.02; }
  info = "**Правило Лопиталя:** lim(x→0) (eˣ − 1)/x — неопределённость 0/0. По правилу Лопиталя этот предел равен пределу отношения производных: lim(x→0) eˣ/1 = 1. Синий — f(x) = (eˣ − 1)/x, оранжевый — g(x) = eˣ.\n\nПри x = " + num(t, 2) + ": f(x) = " + format(f(t), 3) + ", g(x) = " + format(g(t), 3) + ".";
}
]
