[
description = "{info}"
field width = 20; field height = 10;
camera type = fixed;
float a = -6; float b = -3; string info = "";
Function num(x, dd) { if (x < 0) { return "−" + format(-x, dd); } return format(x, dd); }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "A"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "S"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #22c55e }
new Line { name = "axisL"; pos = ((-9.5, 0), (9.5, 0)) }
new Line { name = "seg1"; pos = (O, A); color = #3b82f6 }
new Line { name = "seg2"; pos = (A, S); color = #f59e0b }
draw Vector { name = "v1"; edge = "seg1" }
draw Vector { name = "v2"; edge = "seg2" }
draw Text { name = "tO"; pos = (0, 1); text = "0"; size = 0.8 }
draw Text { name = "tA"; pos = (a, 1); text = num(a, 0); size = 0.8 }
draw Text { name = "tS"; pos = (a + b, -1.2); text = num(a + b, 0); size = 0.8 }
new UI { type = slider; label = "a"; variable = a; min = -9; max = 9; step = 1; default = -6 }
new UI { type = slider; label = "b"; variable = b; min = -9; max = 9; step = 1; default = -3 }
Update {
  if (a == 0) { a = 1; } if (b == 0) { b = 1; } if (a * b < 0) { b = -b; }
  A.pos.x = a; S.pos.x = a + b;
  string sg = "+"; if (a < 0) { sg = "−"; }
  info = "Одинаковые знаки: расстояния от нуля складываются, направление сохраняется. Синяя стрелка — сдвиг на a, оранжевая — сдвиг на b.\n\n" + num(a, 0) + " + (" + num(b, 0) + ") = " + sg + "(" + format(abs(a), 0) + " + " + format(abs(b), 0) + ") = **" + num(a + b, 0) + "**.";
}
]
