[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = -1; float b = 2; float c = 1; string info = "";
func f(x) = (x - a) * (x - b) * (x * x + c);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = -3; max = 3; step = 0.1; default = -1 }
new UI { type = slider; label = "b"; variable = b; min = -3; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "c"; variable = c; min = 0.2; max = 5; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function mi(x, d) { if (x < 0) { return "+ " + format(-x, d); } return "− " + format(x, d); }
Update {
  info = "**Разложение на неприводимые множители:** P(x) = (x " + mi(a, 1) + ")(x " + mi(b, 1) + ")(x² + " + format(c, 1) + ").\n\nМножитель (x² + " + format(c, 1) + ") неприводим над действительными числами: его дискриминант −4·" + format(c, 1) + " < 0, действительных корней нет, а линейные множители (x " + mi(a, 1) + ") и (x " + mi(b, 1) + ") дальше не раскладываются.";
}
]
