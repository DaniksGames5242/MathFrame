[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float t = 1; float eps = 0.5; string info = "";
func f(x) = x;
func e1(x) = eps;
func e2(x) = -eps;
draw Function { name = "gr"; f = "f"; xmin = -6; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "b1"; f = "e1"; xmin = -6; xmax = 6; color = #22c55e; thickness = 1 }
draw Function { name = "b2"; f = "e2"; xmin = -6; xmax = 6; color = #22c55e; thickness = 1 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "x"; variable = t; min = -5; max = 5; step = 0.05; default = 1 }
new UI { type = slider; label = "ε"; variable = eps; min = 0.1; max = 3; step = 0.1; default = 0.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  P.pos.x = t; P.pos.y = t;
  string s = "внутри полосы |f(x)| < ε"; if (abs(t) >= eps) { s = "вне полосы |f(x)| ≥ ε"; }
  info = "**Бесконечно малая величина** f(x) = x при x → 0 становится меньше по модулю любого заранее заданного ε > 0. Зелёные линии — полоса ±ε.\n\nПри x = " + num(t, 2) + ", ε = " + format(eps, 1) + ": точка " + s + ". Приближая x к 0, всегда можно попасть в полосу для любого сколь угодно малого ε.";
}
]
