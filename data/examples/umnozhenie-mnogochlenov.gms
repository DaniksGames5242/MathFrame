[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float p = 2; float q = -1; float r = 1; float s = 3; string info = "";
func f(x) = (p * x + q) * (r * x + s);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "p"; variable = p; min = -3; max = 3; step = 0.5; default = 2 }
new UI { type = slider; label = "q"; variable = q; min = -5; max = 5; step = 0.5; default = -1 }
new UI { type = slider; label = "r"; variable = r; min = -3; max = 3; step = 0.5; default = 1 }
new UI { type = slider; label = "s"; variable = s; min = -5; max = 5; step = 0.5; default = 3 }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Update {
  float A = p * r; float B = p * s + q * r; float C = q * s;
  info = "**(px " + term(q, 1) + ")(rx " + term(s, 1) + ")** при p = " + format(p, 1) + ", q = " + format(q, 1) + ", r = " + format(r, 1) + ", s = " + format(s, 1) + ".\n\nКаждый член первого множителя умножается на каждый член второго: (px)(rx) + (px)(s) + q(rx) + qs = " + format(A, 1) + "x² " + term(B, 1) + "x " + term(C, 1) + ".";
}
]
