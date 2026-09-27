[
description = "{info}"
field width = 20; field height = 8;
camera type = fixed;
show axis x = true;
float a = 5; float b = -4; string info = ""; float diff = 0;
new Point { name = "O1"; pos = (0, 2); dynamic = false; collision = false; active = false }
new Point { name = "A1"; pos = (5, 2); dynamic = false; collision = false; active = false }
new Point { name = "A2"; pos = (5, 0.4); dynamic = false; collision = false; active = false }
new Point { name = "B2"; pos = (9, 0.4); dynamic = false; collision = false; active = false }
new Point { name = "O3"; pos = (0, -2); dynamic = false; collision = false; active = false }
new Point { name = "S3"; pos = (9, -2); dynamic = false; collision = false; active = false }
new Line { name = "la"; pos = (O1, A1); interact = false; color = #3b82f6 }
new Line { name = "lb"; pos = (A2, B2); interact = false; color = #f59e0b }
new Line { name = "ls"; pos = (O3, S3); interact = false; color = #22c55e }
draw Vector { name = "va"; edge = "la"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "vb"; edge = "lb"; pos = 1; color = #f59e0b; thickness = 3 }
draw Vector { name = "vs"; edge = "ls"; pos = 1; color = #22c55e; thickness = 3 }
new UI { type = slider; label = "уменьшаемое a"; variable = a; min = -9; max = 9; step = 0.5; default = 5 }
new UI { type = slider; label = "вычитаемое b"; variable = b; min = -9; max = 9; step = 0.5; default = -4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function numP(x, d) { if (x < 0) { return "(−" + format(-x, d) + ")"; } return format(x, d); }
Function clx(x) { return min(max(x, -fieldMaxX), fieldMaxX); }
Update {
  diff = a - b;
  A1.pos.x = clx(a); A2.pos.x = clx(a); B2.pos.x = clx(diff); S3.pos.x = clx(diff);
  info = "Синяя стрелка — a = " + num(a, 1) + ". Вычесть b — то же, что сдвинуться на −b: оранжевая стрелка ведёт из a на " + num(-b, 1) + ". Зелёная стрелка от нуля — итог: a − b = " + num(a, 1) + " − " + numP(b, 1) + " = **" + num(diff, 1) + "**.";
}
]
