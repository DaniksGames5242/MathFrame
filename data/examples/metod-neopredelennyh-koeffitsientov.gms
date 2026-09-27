[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float B0 = 1; float C0 = -6; float p = 0; float q = 0; string info = "";
func target(x) = x * x + B0 * x + C0;
func guess(x) = (x + p) * (x + q);
draw Function { name = "gt"; f = "target"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 4 }
draw Function { name = "gg"; f = "guess"; xmin = -10; xmax = 10; color = #22c55e; thickness = 2 }
new UI { type = slider; label = "p (в множителе x + p)"; variable = p; min = -6; max = 6; step = 0.5; default = 0 }
new UI { type = slider; label = "q (в множителе x + q)"; variable = q; min = -6; max = 6; step = 0.5; default = 0 }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "**Дан многочлен x² " + term(B0, 0) + "x " + term(C0, 0) + "**, предполагаем разложение (x + p)(x + q) = x² + (p + q)x + pq.\n\nСейчас p + q = " + format(p + q, 1) + ", pq = " + format(p * q, 1) + " — нужно " + num(B0, 0) + " и " + num(C0, 0) + " соответственно.";
  if (abs(p + q - B0) < 0.05 && abs(p * q - C0) < 0.05) { info = info + "\n\n**Совпало!** Коэффициенты подобраны верно, зелёная и синяя кривые слились."; }
}
]
