[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; string info = "";
func f(x) = log(x) / log(a);
draw Function { name = "gr"; f = "f"; xmin = 0.001; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "основание a"; variable = a; min = 0.2; max = 5; step = 0.1; default = 2 }
Update {
  if (abs(a - 1) < 0.05) { a = 1.1; }
  string m = "возрастает"; if (a < 1) { m = "убывает"; }
  info = "**Логарифмическая функция** y = logₐ x при a = " + format(a, 1) + " определена при x > 0 и " + m + ".\n\nГрафик проходит через (1; 0), так как logₐ 1 = 0, и через (a; 1): logₐ a = 1.";
}
]
