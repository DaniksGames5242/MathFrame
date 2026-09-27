[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = -2; float b = 2; string info = "";
func f(x) = 1 / ((x - a) * (x - b));
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = -4; max = 4; step = 0.1; default = -2 }
new UI { type = slider; label = "b"; variable = b; min = -4; max = 4; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function mi(x, d) { if (x < 0) { return "+ " + format(-x, d); } return "− " + format(x, d); }
Update {
  if (abs(a - b) < 0.3) { b = a + 0.3; }
  info = "**ОДЗ дроби** f(x) = 1/[(x " + mi(a, 1) + ")(x " + mi(b, 1) + ")]: знаменатель равен нулю при x = " + num(a, 1) + " и x = " + num(b, 1) + ", поэтому эти значения исключены.\n\nОбласть допустимых значений — все x, кроме " + num(a, 1) + " и " + num(b, 1) + " (видны как разрывы графика).";
}
]
