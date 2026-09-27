[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float b = 1; string info = "";
func f(x) = sin(b * x);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "b (коэффициент)"; variable = b; min = 0.5; max = 3; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float period = 6.2832 / b;
  info = "Функция y = sin(" + format(b, 1) + "x) имеет период T = 2π/b ≈ " + format(period, 2) + ". На каждом отрезке длины T график повторяется.";
}
]
