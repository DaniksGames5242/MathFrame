[
description = "{info}"
field width = 20; field height = 8;
camera type = fixed;
float a = 4; float b = -3; string info = ""; float prod = 0; float sc = 1;
new Point { name = "O1"; pos = (0, 2); dynamic = false; collision = false; active = false }
new Point { name = "A1"; pos = (4, 2); dynamic = false; collision = false; active = false }
new Point { name = "O2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "B2"; pos = (-3, 0); dynamic = false; collision = false; active = false }
new Point { name = "O3"; pos = (0, -2); dynamic = false; collision = false; active = false }
new Point { name = "S3"; pos = (-12, -2); dynamic = false; collision = false; active = false }
new Line { name = "la"; pos = (O1, A1); interact = false; color = #3b82f6 }
new Line { name = "lb"; pos = (O2, B2); interact = false; color = #f59e0b }
new Line { name = "ls"; pos = (O3, S3); interact = false; color = #22c55e }
draw Vector { name = "va"; edge = "la"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "vb"; edge = "lb"; pos = 1; color = #f59e0b; thickness = 3 }
draw Vector { name = "vs"; edge = "ls"; pos = 1; color = #22c55e; thickness = 3 }
draw Text { name = "l0"; pos = (0, 3); text = "0"; size = 0.8 }
new UI { type = slider; label = "множитель a"; variable = a; min = -9; max = 9; step = 0.5; default = 4 }
new UI { type = slider; label = "множитель b"; variable = b; min = -9; max = 9; step = 0.5; default = -3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function numP(x, d) { if (x < 0) { return "(−" + format(-x, d) + ")"; } return format(x, d); }
Update {
  prod = a * b;
  sc = fieldMaxX / max(abs(a), max(abs(b), max(abs(prod), 1)));
  A1.pos.x = a * sc; B2.pos.x = b * sc; S3.pos.x = prod * sc;
  string rule = "разные знаки — произведение отрицательно"; if (a * b > 0) { rule = "одинаковые знаки — произведение положительно"; } if (prod == 0) { rule = "один из множителей — нуль"; }
  info = "Синяя стрелка — a = " + num(a, 1) + ", оранжевая — b = " + num(b, 1) + " (масштаб общий для всех трёх). По правилу знаков: " + rule + ". Зелёная стрелка — итог: a × b = " + num(a, 1) + " × " + numP(b, 1) + " = **" + num(prod, 1) + "**.";
}
]
