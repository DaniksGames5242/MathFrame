[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 1; float n = 2; string info = "";
func f(x) = exp(x);
func p(x) = approx(x, a, n);
draw Function { name = "gf"; f = "f"; xmin = -6; xmax = 6; grid = true; thickness = 2 }
draw Function { name = "gp"; f = "p"; xmin = -6; xmax = 6; color = #f59e0b; thickness = 3 }
new UI { type = slider; label = "точка разложения a"; variable = a; min = -3; max = 3; step = 0.5; default = 1 }
new UI { type = slider; label = "число членов n"; variable = n; min = 1; max = 6; step = 1; default = 2 }
Function approx(x, c, m) {
  float s = 0; float term = 1; float k = 0;
  repeat (m) { s = s + term; k = k + 1; term = term * (x - c) / k; }
  return exp(c) * s;
}
Update {
  float deg = n - 1;
  float err = abs(f(a + 2) - p(a + 2));
  info = "**Формула Тейлора** для f(x) = eˣ в окрестности точки x = a = " + format(a, 1) + ": Pₙ(x) = f(a) + f′(a)(x − a) + f″(a)(x − a)²/2! + … (n = " + format(n, 0) + " членов, степень " + format(deg, 0) + "), оранжевый график — Pₙ(x).\n\nВ точке x = a + 2 отклонение |f(x) − Pₙ(x)| ≈ " + format(err, 3) + " — с ростом n многочлен точнее совпадает с f около a.";
}
]
