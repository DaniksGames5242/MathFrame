[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = 1; float x0 = 0; string info = "";
func f(x) = 1 / (x - a);
func g(x) = b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gl"; f = "g"; xmin = -10; xmax = 10; color = #22c55e; thickness = 2 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "a"; variable = a; min = -4; max = 4; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -3; max = 3; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(b) < 0.1) { if (b >= 0) { b = 0.1; } if (b < 0) { b = -0.1; } }
  x0 = a + 1 / b;
  R1.pos.x = x0; R1.pos.y = b;
  info = "**Дробно-рациональное уравнение** 1/(x − " + format(a, 1) + ") = " + num(b, 1) + " определено при x ≠ " + format(a, 1) + " (это ОДЗ). Умножив обе части на (x − " + format(a, 1) + "), получаем корень x = " + num(x0, 2) + " — он не равен " + format(a, 1) + ", значит подходит по ОДЗ.";
}
]
