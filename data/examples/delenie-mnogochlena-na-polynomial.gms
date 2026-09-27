[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = -2; float b = 1; float d = 2; string info = "";
func f(x) = x * x * x + a * x + b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "a"; variable = a; min = -5; max = 5; step = 0.5; default = -2 }
new UI { type = slider; label = "b"; variable = b; min = -5; max = 5; step = 0.5; default = 1 }
new UI { type = slider; label = "делитель x − d, d"; variable = d; min = -3; max = 3; step = 0.5; default = 1 }
Function term(x, dd) { if (x < 0) { return "− " + format(-x, dd); } return "+ " + format(x, dd); }
Update {
  float r = d * d * d + a * d + b;
  R1.pos.x = d; R1.pos.y = r;
  info = "**Делим P(x) = x³ " + term(a, 1) + "x " + term(b, 1) + " на (x " + term(-d, 1) + ")**: частное Q(x) = x² " + term(d, 1) + "x " + term(a + d * d, 1) + ", остаток r = " + format(r, 2) + ".\n\nПо теореме об остатке r = P(" + format(d, 1) + ") — оранжевая точка на графике.";
  if (abs(r) < 0.05) { info = info + " Остаток равен нулю — (x " + num(-d, 1) + ") делит P(x) без остатка."; }
}
]
