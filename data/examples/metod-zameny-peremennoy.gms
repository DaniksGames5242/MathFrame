[
description = "{info}"
field width = 14; field height = 6;
camera type = fixed;
float p = -5; float q = 4; string info = ""; float Dt = 0; float ok1 = 0; float ok2 = 0;
draw Graph { name = "ax"; graph = "gax"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = ok1 > 0.5 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = ok1 > 0.5 }
new Point { name = "R3"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; active = ok2 > 0.5 }
new Point { name = "R4"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; active = ok2 > 0.5 }
new UI { type = slider; label = "p"; variable = p; min = -8; max = 8; step = 0.1; default = -5 }
new UI { type = slider; label = "q"; variable = q; min = -8; max = 8; step = 0.1; default = 4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  gax = newGraph(); addNode(gax, "a1", [-6.5, 0]); addNode(gax, "a2", [6.5, 0]); addEdge(gax, "a1", "a2");
  Dt = p * p - 4 * q; ok1 = 0; ok2 = 0;
  if (Dt >= 0) {
    float t1 = (-p - sqrt(Dt)) / 2; float t2 = (-p + sqrt(Dt)) / 2;
    if (t1 >= 0) { ok1 = 1; R1.pos.x = -sqrt(t1); R2.pos.x = sqrt(t1); }
    if (t2 >= 0) { ok2 = 1; R3.pos.x = -sqrt(t2); R4.pos.x = sqrt(t2); }
    info = "Замена t = x² сводит уравнение x⁴ " + num2(p) + "x² " + num2(q) + " = 0 к квадратному t² " + num2(p) + "t " + num2(q) + " = 0 с корнями t₁ = " + format(t1, 2) + ", t₂ = " + format(t2, 2) + ". Обратная подстановка x = ±√t даёт действительные x только при t ≥ 0.";
  }
  if (Dt < 0) { info = "Дискриминант вспомогательного уравнения t² " + num2(p) + "t " + num2(q) + " = 0 отрицателен — действительных корней нет."; }
}
Function num2(v) { if (v < 0) { return "− " + format(-v, 1); } return "+ " + format(v, 1); }
]
