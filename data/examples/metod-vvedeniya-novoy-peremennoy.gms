[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float p = -5; float q = 4; float D = 0; string info = "";
func f(x) = x * x * x * x + p * x * x + q;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = D >= 0 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = D >= 0 }
new Point { name = "R3"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = D > 0.0001 }
new Point { name = "R4"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = D > 0.0001 }
new UI { type = slider; label = "p"; variable = p; min = -8; max = 8; step = 0.1; default = -5 }
new UI { type = slider; label = "q"; variable = q; min = -8; max = 8; step = 0.1; default = 4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Update {
  D = p * p - 4 * q;
  R1.active = false; R2.active = false; R3.active = false; R4.active = false;
  if (D > 0.0001) {
    float t1 = (-p - sqrt(D)) / 2; float t2 = (-p + sqrt(D)) / 2;
    if (t1 > 0.0001) { R1.active = true; R1.pos.x = -sqrt(t1); R2.active = true; R2.pos.x = sqrt(t1); }
    if (t2 > 0.0001) { R3.active = true; R3.pos.x = -sqrt(t2); R4.active = true; R4.pos.x = sqrt(t2); }
    info = "**Метод введения новой переменной**: в уравнении x⁴ " + term(p, 1) + "x² " + term(q, 1) + " = 0 вводим t = x² ≥ 0 и получаем t² " + term(p, 1) + "t " + term(q, 1) + " = 0, t₁ = " + num(t1, 2) + ", t₂ = " + num(t2, 2) + ". Возвращаясь к x = ±√t, из t ≥ 0 получаются корни исходного уравнения (оранжевые точки).";
  }
  if (D <= 0.0001) { info = "t² " + term(p, 1) + "t " + term(q, 1) + " = 0 не даёт неотрицательных корней t — исходное уравнение x⁴ " + term(p, 1) + "x² " + term(q, 1) + " = 0 действительных решений не имеет."; }
}
]
