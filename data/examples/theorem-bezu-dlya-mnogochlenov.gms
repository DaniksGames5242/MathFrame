[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; string info = "";
func f(x) = 0.15*x*x*x - x + 1;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "a"; variable = a; min = -3; max = 3; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function mi(x, d) { if (x < 0) { return "+ " + format(-x, d); } return "− " + format(x, d); }
Update {
  float R = 0.15 * a * a * a - a + 1;
  R1.pos.x = a; R1.pos.y = R;
  string ct = "не равен нулю, и (x " + mi(a, 1) + ") не делит P(x): точка a не корень многочлена.";
  if (abs(R) < 0.05) { ct = "равен нулю, значит (x " + mi(a, 1) + ") делит P(x) без остатка: точка a — корень многочлена."; }
  info = "**Теорема Безу:** P(x) = (x " + mi(a, 1) + ")·Q(x) + R, и подстановка x = " + num(a, 1) + " даёт P(" + num(a, 1) + ") = R.\n\nЗдесь R = " + num(R, 2) + " (отмечено на графике) " + ct;
}
]
