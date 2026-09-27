[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
new Point { name = "C"; pos = (-4, -1); text = true("C") }
new Point { name = "D"; pos = (3, 2); text = true("D") }
new Point { name = "A"; pos = (0, 3); color = #f59e0b; text = true("A") }
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "l"; pos = (L1, L2) }
string info = "";
Function tHit(p, d, half) { if (d > 0) { return (half - p) / d; } if (d < 0) { return (-half - p) / d; } return 1e9; }
Update {
  float dx = D.pos.x - C.pos.x; float dy = D.pos.y - C.pos.y;
  if (abs(dx) + abs(dy) < 0.05) { D.pos.x = C.pos.x + 1; dx = 1; }
  float t = min(tHit(C.pos.x, dx, 8), tHit(C.pos.y, dy, 5));
  float s = min(tHit(C.pos.x, -dx, 8), tHit(C.pos.y, -dy, 5));
  L1.pos.x = C.pos.x - s * dx; L1.pos.y = C.pos.y - s * dy;
  L2.pos.x = C.pos.x + t * dx; L2.pos.y = C.pos.y + t * dy;
  float cr = dx * (A.pos.y - C.pos.y) - dy * (A.pos.x - C.pos.x);
  if (abs(cr) < 0.2) { info = "Точка A принадлежит прямой CD: её координаты обращают уравнение прямой в верное равенство."; }
  if (abs(cr) >= 0.2) { info = "Точка A не принадлежит прямой CD: подстановка её координат не удовлетворяет уравнению прямой."; }
}
]
