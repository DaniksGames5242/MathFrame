[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1.5; float b = 2; string info = "";
func f(x) = (x - a) * (x + b);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = -2; max = 4; step = 0.1; default = 1.5 }
new UI { type = slider; label = "b"; variable = b; min = 0.5; max = 5; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  string sign1 = "положительна"; string sign2 = "отрицательна"; string sign3 = "положительна";
  if (a < 0 && -b < a) { sign1 = "положительна"; sign2 = "отрицательна"; sign3 = "положительна"; }
  info = "На интервале (−∞, " + num(-b, 1) + ") функция " + sign1 + ", на (" + num(-b, 1) + ", " + num(a, 1) + ") — " + sign2 + ", на (" + num(a, 1) + ", +∞) — " + sign3 + ".";
}
]
