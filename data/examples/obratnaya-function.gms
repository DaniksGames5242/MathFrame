[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k = 2; float b = 1; string info = "";
func idn(x) = x;
func f(x) = k * x + b;
func g(x) = (x - b) / k;
draw Function { name = "g0"; f = "idn"; xmin = -10; xmax = 10; grid = true; thickness = 1 }
draw Function { name = "g1"; f = "f"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 3 }
draw Function { name = "g2"; f = "g"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 3 }
new UI { type = slider; label = "k"; variable = k; min = -3; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = -5; max = 5; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return " − " + format(-x, d); } return " + " + format(x, d); }
Update {
  if (abs(k) < 0.05) { k = 0.1; }
  info = "Синий — y = " + num(k, 1) + "x" + term(b, 1) + ", оранжевый — обратная функция x = (y" + term(-b, 1) + ") / " + num(k, 1) + ", т.е. y = (x" + term(-b, 1) + ") / " + num(k, 1) + ". Тонкая прямая — ось симметрии y = x: графики взаимно обратных функций симметричны относительно неё.";
}
]
