[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = 0; string info = "";
func f(x) = -a * x - b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = 0.1; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -5; max = 5; step = 0.1; default = 0 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  info = "**y = −ax − b** при a = " + format(a, 1) + ", b = " + format(b, 1) + ": функция убывает на всей числовой оси. При увеличении x на 1 значение y уменьшается на " + format(a, 1) + ".";
}
]
