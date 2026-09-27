[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
float n = 2; float a = 1.5; string info = "";
func f(x) = pow(x, n);
draw Function { name = "gr"; f = "f"; xmin = -7; xmax = 7; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "показатель n"; variable = n; min = 1; max = 6; step = 1; default = 2 }
new UI { type = slider; label = "основание a"; variable = a; min = -3; max = 3; step = 0.1; default = 1.5 }
Update {
  float an = pow(a, n);
  info = "**Степень с натуральным показателем n:** aⁿ = a · a · … · a (n раз).\n\nПри a = " + format(a, 1) + ", n = " + format(n, 0) + ": aⁿ = " + format(an, 3) + ".";
}
]
