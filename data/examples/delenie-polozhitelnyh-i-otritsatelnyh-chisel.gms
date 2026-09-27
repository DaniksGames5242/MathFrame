[
description = "{info}"
field width = 20; field height = 8;
camera type = fixed;
float a = 12; float b = -3; string info = ""; float quot = 0; float sc = 1;
new Point { name = "O1"; pos = (0, 2); dynamic = false; collision = false; active = false }
new Point { name = "A1"; pos = (12, 2); dynamic = false; collision = false; active = false }
new Point { name = "O2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "B2"; pos = (-3, 0); dynamic = false; collision = false; active = false }
new Point { name = "O3"; pos = (0, -2); dynamic = false; collision = false; active = false }
new Point { name = "S3"; pos = (-4, -2); dynamic = false; collision = false; active = false }
new Line { name = "la"; pos = (O1, A1); interact = false; color = #3b82f6 }
new Line { name = "lb"; pos = (O2, B2); interact = false; color = #f59e0b }
new Line { name = "ls"; pos = (O3, S3); interact = false; color = #22c55e }
draw Vector { name = "va"; edge = "la"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "vb"; edge = "lb"; pos = 1; color = #f59e0b; thickness = 3 }
draw Vector { name = "vs"; edge = "ls"; pos = 1; color = #22c55e; thickness = 3 }
draw Text { name = "l0"; pos = (0, 3); text = "0"; size = 0.8 }
new UI { type = slider; label = "делимое a"; variable = a; min = -18; max = 18; step = 1; default = 12 }
new UI { type = slider; label = "делитель b"; variable = b; min = -9; max = 9; step = 1; default = -3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function numP(x, d) { if (x < 0) { return "(−" + format(-x, d) + ")"; } return format(x, d); }
Update {
  if (abs(b) < 1) { b = 1; }
  quot = a / b; sc = fieldMaxX / max(abs(a), max(abs(b), max(abs(quot), 1)));
  A1.pos.x = a * sc; B2.pos.x = b * sc; S3.pos.x = quot * sc;
  string rule = "разные знаки — частное отрицательно"; if (a * b > 0) { rule = "одинаковые знаки — частное положительно"; }
  info = "Синяя стрелка — делимое a = " + num(a, 1) + ", оранжевая — делитель b = " + num(b, 1) + " (масштаб общий для всех трёх). По правилу знаков: " + rule + ". Зелёная стрелка — итог: a ÷ b = " + num(a, 1) + " ÷ " + numP(b, 1) + " = **" + num(quot, 2) + "**.";
}
]
