[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
float L = 5; float x = 3; float y = 0; string info = "";
new Point { name = "W"; pos = (-4, -4); dynamic = false; collision = false }
new Point { name = "F"; pos = (-4, -4); dynamic = false; collision = false; text = true("F") }
new Point { name = "T"; pos = (-4, -4); dynamic = false; collision = false; text = true("T") }
new Line { name = "wall"; pos = (W, T) }
new Line { name = "floor"; pos = (W, F) }
new Line { name = "ladder"; pos = (F, T); color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "расстояние нижнего конца от стены x"; variable = x; min = 0.3; max = 4.9; step = 0.1; default = 3 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  y = sqrt(L * L - x * x);
  F.pos.x = -4 + x;
  T.pos.y = -4 + y;
  float vy = -x / y;
  info = "Лестница постоянной длины L = " + format(L, 1) + " скользит по стене: нижний конец F в x = " + format(x, 1) + " м от стены, верхний конец T на высоте y = " + format(y, 2) + " м, x² + y² = L².\n\nСкорости концов связаны: dy/dt = −(x/y)·dx/dt. При x = " + format(x, 1) + ": если нижний конец удаляется со скоростью dx/dt = 1, верхний опускается со скоростью dy/dt ≈ " + num(vy, 2) + ".";
}
]
