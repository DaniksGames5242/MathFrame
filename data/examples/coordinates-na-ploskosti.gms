[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
new Point { name = "A"; pos = (3, 2); pauseOnDrag = false; color = #3b82f6 }
Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Update {
  info = "Пара чисел (x; y) однозначно задаёт положение точки на плоскости. Точка A имеет координаты (" + num(A.pos.x) + "; " + num(A.pos.y) + ") — первое число (абсцисса) и второе (ордината).\n\nМалое смещение точки меняет её координаты на столько же — координаты меняются непрерывно вместе с положением точки.";
}
]
