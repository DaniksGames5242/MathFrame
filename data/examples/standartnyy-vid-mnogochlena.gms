[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a1 = 3; float a2 = -1; float b = 2; string info = "";
func f(x) = (a1 + a2) * x * x + b * x;
draw Function { name = "gr"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a1"; variable = a1; min = -4; max = 4; step = 0.5; default = 3 }
new UI { type = slider; label = "a2"; variable = a2; min = -4; max = 4; step = 0.5; default = -1 }
new UI { type = slider; label = "b"; variable = b; min = -6; max = 6; step = 0.5; default = 2 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function term(v, d) { if (v < 0) { return "− " + format(-v, d); } return "+ " + format(v, d); }
Update {
  float k = a1 + a2;
  info = "Многочлен " + format(a1,1) + "x² " + term(a2,1) + "x² " + term(b,1) + "x записан не в стандартном виде — объединим подобные члены " + format(a1,1) + "x² и " + num(a2,1) + "x²: коэффициенты складываются, " + format(a1,1) + " " + term(a2,1) + " = " + format(k,1) + ".\n\n**Стандартный вид:** y = " + format(k,1) + "x² " + term(b,1) + "x.";
}
]
