[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; string info = "";
func f(x) = 1 / (x - a);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = -4; max = 4; step = 0.1; default = 2 }
// Числа для формул: минус — обычный «-» (KaTeX сам рисует его правильно)
Function tx(x, d) { if (x < 0) { return "-" + format(-x, d); } return format(x, d); }
Function mi(x, d) { if (x < 0) { return "+ " + format(-x, d); } return "- " + format(x, d); }
Update {
  if (abs(a) < 0.1) { a = 0.1; }
  info = "**Алгебраическая дробь** \\(f(x) = \\dfrac{1}{x " + mi(a, 1) + "}\\) — частное многочленов \\(1\\) и \\(x " + mi(a, 1) + "\\).\n\nЗнаменатель не может обращаться в ноль, поэтому дробь определена при \\(x \\ne " + tx(a, 1) + "\\) — на графике это вертикальная асимптота \\(x = " + tx(a, 1) + "\\).";
}
]