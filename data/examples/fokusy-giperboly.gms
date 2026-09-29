[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a = 2.5; float b = 2; float c = 3.2; float sm = 1.5; string info = "";
func as1(x) = (b / a) * x;
func as2(x) = -(b / a) * x;
new Curve { name = "hr"; type = parametric; x = "a * (exp(sm * (2 * t - 1)) + exp(-sm * (2 * t - 1))) / 2"; y = "b * (exp(sm * (2 * t - 1)) - exp(-sm * (2 * t - 1))) / 2"; color = #3b82f6; thickness = 3 }
new Curve { name = "hl"; type = parametric; x = "-a * (exp(sm * (2 * t - 1)) + exp(-sm * (2 * t - 1))) / 2"; y = "b * (exp(sm * (2 * t - 1)) - exp(-sm * (2 * t - 1))) / 2"; color = #3b82f6; thickness = 3 }
draw Function { name = "s1"; f = "as1"; xmin = -8; xmax = 8; color = #3b82f6; thickness = 1 }
draw Function { name = "s2"; f = "as2"; xmin = -8; xmax = 8; color = #3b82f6; thickness = 1 }
new Point { name = "F1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("F₁") }
new Point { name = "F2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("F₂") }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "A"; pos = (0, 0); dynamic = false; collision = false; text = true("A") }
new Point { name = "K"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; text = true("K") }
new Point { name = "P"; curve = "hr"; t = 0.75; text = true("M"); pauseOnDrag = false; layer = 60 }
new Line { name = "p1"; pos = (F1, P); color = #f59e0b }
new Line { name = "p2"; pos = (F2, P); color = #f59e0b }
new Line { name = "oa"; pos = (O, A); color = #22c55e }
new Line { name = "ak"; pos = (A, K); color = #22c55e }
new Line { name = "ok"; pos = (O, K); color = #22c55e }
new UI { type = slider; label = "действительная полуось a"; variable = a; min = 1; max = 3.5; step = 0.1; default = 2.5 }
new UI { type = slider; label = "мнимая полуось b"; variable = b; min = 0.5; max = 3; step = 0.1; default = 2 }
Function dist(X, Y, U, V) { return sqrt((X - U) * (X - U) + (Y - V) * (Y - V)); }
Update {
  c = sqrt(a * a + b * b);
  float z = 4.9 / b; float w = 7.9 / a;
  sm = min(ln(z + sqrt(z * z + 1)), ln(w + sqrt(w * w - 1)));
  F1.pos.x = -c; F1.pos.y = 0; F2.pos.x = c; F2.pos.y = 0;
  A.pos.x = a; A.pos.y = 0; K.pos.x = a; K.pos.y = b;
  float p1 = dist(P.pos.x, P.pos.y, -c, 0); float p2 = dist(P.pos.x, P.pos.y, c, 0);
  info = "**Фокусы гиперболы** F₁ и F₂ лежат на действительной оси симметрично относительно центра O на расстоянии c = " + format(c, 2) + " от него; для любой точки M кривой модуль разности расстояний до них постоянен и равен длине действительной оси: |MF₁ − MF₂| = |" + format(p1, 2) + " − " + format(p2, 2) + "| = " + format(abs(p1 - p2), 2) + " = 2a.\n\nРасстояние до фокуса связано с полуосями теоремой Пифагора в треугольнике OAK (зелёный) с катетами a = " + format(a, 1) + " и b = " + format(b, 1) + ": c = √(a² + b²) = √(" + format(a * a, 2) + " + " + format(b * b, 2) + ") = " + format(c, 2) + " > a, поэтому фокусы лежат вне отрезка между вершинами.";
}
]
