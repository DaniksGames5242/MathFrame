[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float s = 5; float p = 4; float D = 0; string info = "";
func f(x) = x * x - s * x + p;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = D >= 0 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = D > 0.0001 }
new UI { type = slider; label = "сумма s = x + y"; variable = s; min = -8; max = 8; step = 0.1; default = 5 }
new UI { type = slider; label = "произведение p = xy"; variable = p; min = -10; max = 10; step = 0.1; default = 4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Update {
  D = s * s - 4 * p;
  if (D > 0.0001) { float t1 = (s - sqrt(D)) / 2; float t2 = (s + sqrt(D)) / 2; R1.pos.x = t1; R2.pos.x = t2; info = "**Метод введения новых переменных** для системы x + y = " + num(s, 1) + ", xy = " + num(p, 1) + ": x и y — корни вспомогательного уравнения t² " + term(-s, 1) + "t " + term(p, 1) + " = 0 (график). D = " + num(D, 2) + " > 0 — t₁ = " + num(t1, 2) + ", t₂ = " + num(t2, 2) + ", значит система имеет решения x = " + num(t1, 2) + ", y = " + num(t2, 2) + " и наоборот."; }
  if (abs(D) <= 0.0001) { float t1 = s / 2; R1.pos.x = t1; info = "D = 0 — единственное решение x = y = " + num(t1, 2) + "."; }
  if (D < -0.0001) { info = "D = " + num(D, 2) + " < 0 — вспомогательное уравнение решений не имеет, значит и система не имеет действительных решений."; }
}
]
