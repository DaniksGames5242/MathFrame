[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
float n = 2; string info = "";
func f(x) = cos(x);
func p(x) = approx(x, n);
draw Function { name = "gf"; f = "f"; xmin = -6; xmax = 6; grid = true; thickness = 2 }
draw Function { name = "gp"; f = "p"; xmin = -6; xmax = 6; color = #f59e0b; thickness = 3 }
new UI { type = slider; label = "число членов n"; variable = n; min = 1; max = 6; step = 1; default = 2 }
Function approx(x, m) {
  float s = 0; float term = 1; float k = 0;
  repeat (m) { s = s + term; k = k + 1; term = -term * x * x / ((2 * k - 1) * (2 * k)); }
  return s;
}
Update {
  float deg = 2 * (n - 1);
  float err = abs(f(6) - p(6));
  info = "**Формула Маклорена** для f(x) = cos x (формула Тейлора при a = 0): Pₙ(x) = 1 − x²/2! + x⁴/4! − … (n = " + format(n, 0) + " членов, степень " + format(deg, 0) + "), оранжевый график — Pₙ(x).\n\nПри x = 6 отклонение |f(x) − Pₙ(x)| ≈ " + format(err, 2) + " — с ростом n многочлен точнее повторяет cos x около нуля.";
}
]
