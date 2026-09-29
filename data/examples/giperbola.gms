[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a = 3; float b = 2; float c = 3.6; float sm = 1.5; string info = "";
func as1(x) = (b / a) * x;
func as2(x) = -(b / a) * x;
new Curve { name = "hr"; type = parametric; x = "a * (exp(sm * (2 * t - 1)) + exp(-sm * (2 * t - 1))) / 2"; y = "b * (exp(sm * (2 * t - 1)) - exp(-sm * (2 * t - 1))) / 2"; color = #3b82f6; thickness = 3 }
new Curve { name = "hl"; type = parametric; x = "-a * (exp(sm * (2 * t - 1)) + exp(-sm * (2 * t - 1))) / 2"; y = "b * (exp(sm * (2 * t - 1)) - exp(-sm * (2 * t - 1))) / 2"; color = #3b82f6; thickness = 3 }
draw Function { name = "s1"; f = "as1"; xmin = -8; xmax = 8; color = #3b82f6; thickness = 1 }
draw Function { name = "s2"; f = "as2"; xmin = -8; xmax = 8; color = #3b82f6; thickness = 1 }
new Point { name = "F1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("F₁") }
new Point { name = "F2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("F₂") }
new Point { name = "P"; curve = "hr"; t = 0.75; text = true("M"); pauseOnDrag = false; layer = 60 }
new Point { name = "Q"; curve = "hl"; t = 0.3; text = true("N"); pauseOnDrag = false; layer = 60 }
new Line { name = "p1"; pos = (F1, P); color = #f59e0b }
new Line { name = "p2"; pos = (F2, P); color = #f59e0b }
new Line { name = "q1"; pos = (F1, Q); color = #22c55e }
new Line { name = "q2"; pos = (F2, Q); color = #22c55e }
new UI { type = slider; label = "действительная полуось a"; variable = a; min = 1; max = 3.5; step = 0.1; default = 3 }
new UI { type = slider; label = "мнимая полуось b"; variable = b; min = 0.5; max = 3; step = 0.1; default = 2 }
Function dist(X, Y, U, V) { return sqrt((X - U) * (X - U) + (Y - V) * (Y - V)); }
Update {
  c = sqrt(a * a + b * b);
  float z = 4.9 / b; float w = 7.9 / a;
  sm = min(ln(z + sqrt(z * z + 1)), ln(w + sqrt(w * w - 1)));
  F1.pos.x = -c; F1.pos.y = 0; F2.pos.x = c; F2.pos.y = 0;
  float p1 = dist(P.pos.x, P.pos.y, -c, 0); float p2 = dist(P.pos.x, P.pos.y, c, 0);
  float q1 = dist(Q.pos.x, Q.pos.y, -c, 0); float q2 = dist(Q.pos.x, Q.pos.y, c, 0);
  info = "**Гипербола** x²/a² − y²/b² = 1 — кривая второго порядка из двух ветвей, приближающихся к асимптотам y = ±(b/a)x (серые); у неё есть центр и две оси симметрии. Здесь a = " + format(a, 1) + ", b = " + format(b, 1) + ", фокусы F₁ и F₂ на расстоянии c = √(a² + b²) = " + format(c, 2) + " от центра.\n\nМодуль разности расстояний от точки кривой до фокусов постоянен и равен длине действительной оси 2a = " + format(2 * a, 1) + ": |MF₁ − MF₂| = |" + format(p1, 2) + " − " + format(p2, 2) + "| = " + format(abs(p1 - p2), 2) + ", |NF₁ − NF₂| = |" + format(q1, 2) + " − " + format(q2, 2) + "| = " + format(abs(q1 - q2), 2) + ".";
}
]
