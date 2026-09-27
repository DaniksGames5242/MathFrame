[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 3; string info = "";
func f(x) = x * (x - a);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "a"; variable = a; min = -8; max = 8; step = 0.1; default = 3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  R1.pos.x = 0; R2.pos.x = a;
  info = "Левая часть уравнения x² − " + num(a, 1) + "x = 0 разложена на множители: x(x − " + num(a, 1) + ") = 0. Произведение равно нулю, когда x = 0 или x − " + num(a, 1) + " = 0, то есть корни x₁ = 0 и x₂ = " + num(a, 2) + ".";
}
]
