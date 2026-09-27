[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float x = 3; string info = "";
func f(x) = 1 / ((x - 1) * (x + 1));
func g(x) = 0.5 / (x - 1) - 0.5 / (x + 1);
draw Function { name = "gr"; f = "f"; xmin = -6; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "x"; variable = x; min = -5.8; max = 5.8; step = 0.1; default = 3 }
Update {
  if (abs(x - 1) < 0.2) { x = 1.3; } if (abs(x + 1) < 0.2) { x = -1.3; }
  info = "**Разложение на простейшие дроби (метод неопределённых коэффициентов):** 1/((x − 1)(x + 1)) = A/(x − 1) + B/(x + 1). Приравнивая числители, находим A = 1/2, B = −1/2.\n\nПри x = " + format(x, 2) + ": левая часть = " + format(f(x), 3) + ", правая часть 0,5/(x−1) − 0,5/(x+1) = " + format(g(x), 3) + " — совпадают.";
}
]
