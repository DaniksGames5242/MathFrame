[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 0; float b = 1; float x0 = 0; string info = "";
func f(x) = sqrt(x - a);
func g(x) = b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gl"; f = "g"; xmin = -10; xmax = 10; color = #22c55e; thickness = 2 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = b >= 0 }
new UI { type = slider; label = "a"; variable = a; min = -4; max = 4; step = 0.1; default = 0 }
new UI { type = slider; label = "b"; variable = b; min = -3; max = 3; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  x0 = a + b * b;
  R1.pos.x = x0; R1.pos.y = b;
  if (b >= 0) { info = "**Иррациональное уравнение** √(x − " + format(a, 1) + ") = " + num(b, 1) + ". Возведя в квадрат: x − " + format(a, 1) + " = " + format(b * b, 2) + ", отсюда x = " + num(x0, 2) + ". Так как правая часть b = " + format(b, 1) + " ≥ 0, корень настоящий."; }
  if (b < 0) { info = "**Иррациональное уравнение** √(x − " + format(a, 1) + ") = " + num(b, 1) + ". Формальное возведение в квадрат даёт x = " + num(x0, 2) + ", но √ всегда ≥ 0, а правая часть b = " + num(b, 1) + " < 0 — этот корень **посторонний**, уравнение решений не имеет."; }
}
]
