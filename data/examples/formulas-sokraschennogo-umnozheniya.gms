[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 3; float b = 2; string info = "";
func f(x) = (a + x) * (a + x);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 4 }
new UI { type = slider; label = "a"; variable = a; min = -5; max = 5; step = 0.5; default = 3 }
new UI { type = slider; label = "b (точка x = b)"; variable = b; min = -9; max = 9; step = 0.5; default = 2 }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Update {
  float lhs = (a + b) * (a + b); float rhs = a * a + 2 * a * b + b * b;
  info = "**Квадрат суммы:** (a + b)² = a² + 2ab + b².\n\nПри a = " + format(a, 1) + ", b = " + format(b, 1) + ": (a + b)² = " + format(lhs, 2) + ", и a² + 2ab + b² = " + format(a * a, 1) + " " + term(2 * a * b, 1) + " " + term(b * b, 1) + " = " + format(rhs, 2) + " — значения совпадают.";
}
]
