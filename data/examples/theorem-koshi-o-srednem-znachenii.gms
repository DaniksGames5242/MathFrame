[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
float a = 0.5; float b = 1.4; string info = "";
func f(x) = x * sqrt(x);
draw Function { name = "gr"; f = "f"; xmin = 0.001; xmax = 6; grid = true; thickness = 3 }
new Point { name = "PA"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "PB"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "sec"; pos = (PA, PB); color = #f59e0b }
new Point { name = "C"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "tg"; pos = (T1, T2); color = #3b82f6 }
new UI { type = slider; label = "параметр t = a"; variable = a; min = 0.3; max = 0.9; step = 0.05; default = 0.5 }
new UI { type = slider; label = "параметр t = b"; variable = b; min = 1; max = 1.7; step = 0.05; default = 1.4 }
Update {
  float xa = a * a; float xb = b * b;
  float c = (2.0 / 3.0) * (b * b * b - a * a * a) / (xb - xa);
  float xc = c * c;
  PA.pos.x = xa; PA.pos.y = f(xa);
  PB.pos.x = xb; PB.pos.y = f(xb);
  C.pos.x = xc; C.pos.y = f(xc);
  float m = 1.5 * sqrt(xc);
  float norm = sqrt(1 + m * m);
  T1.pos.x = xc - 2 / norm; T1.pos.y = f(xc) - 2 * m / norm;
  T2.pos.x = xc + 2 / norm; T2.pos.y = f(xc) + 2 * m / norm;
  info = "**Теорема Коши**: функции f(t) = t³, g(t) = t² непрерывны на [a; b] = [" + format(a, 2) + "; " + format(b, 2) + "] и дифференцируемы внутри, g′(t) = 2t ≠ 0. Кривая (g(t), f(t)) — график y = x·√x.\n\nСуществует t = c = " + format(c, 2) + " ∈ (a; b), в которой (f(b) − f(a))/(g(b) − g(a)) = f′(c)/g′(c) = " + format(m, 2) + " — касательная в точке C (синяя) параллельна секущей AB (оранжевая).";
}
]
