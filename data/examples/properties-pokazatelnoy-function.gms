[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float shift = 0; string info = "";
func f(x) = pow(a, x - shift);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a (основание)"; variable = a; min = 1.1; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "сдвиг"; variable = shift; min = -3; max = 3; step = 0.1; default = 0 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a - 1) < 0.05) { a = 1.1; }
  info = "Показательная функция y = " + format(a, 1) + "ˣ при основании a = " + format(a, 1) + " строго возрастает. При x = 0 значение y ≈ " + format(pow(a, -shift), 2) + ".";
}
]
