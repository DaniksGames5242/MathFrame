[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
new Point { name = "A"; pos = (-6, -3); text = true("A") } new Point { name = "B"; pos = (2, 3); text = true("B") }
new Point { name = "C"; pos = (-4, 3); text = true("C") } new Point { name = "D"; pos = (5, -2); text = true("D") }
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false } new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "M1"; pos = (0, 0); dynamic = false; collision = false } new Point { name = "M2"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "l"; pos = (L1, L2) } new Line { name = "m"; pos = (M1, M2); color = #f59e0b }
string info = "";
Function tHit(p, d, half) { if (d > 0) { return (half - p) / d; } if (d < 0) { return (-half - p) / d; } return 1e9; }
Update {
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; if (abs(dx) + abs(dy) < 0.05) { B.pos.x = A.pos.x + 1; dx = 1; }
  float t1 = min(tHit(A.pos.x, dx, 8), tHit(A.pos.y, dy, 5)); float s1 = min(tHit(A.pos.x, -dx, 8), tHit(A.pos.y, -dy, 5));
  L1.pos.x = A.pos.x - s1 * dx; L1.pos.y = A.pos.y - s1 * dy; L2.pos.x = A.pos.x + t1 * dx; L2.pos.y = A.pos.y + t1 * dy;
  float ex = D.pos.x - C.pos.x; float ey = D.pos.y - C.pos.y; if (abs(ex) + abs(ey) < 0.05) { D.pos.x = C.pos.x + 1; ex = 1; }
  float t2 = min(tHit(C.pos.x, ex, 8), tHit(C.pos.y, ey, 5)); float s2 = min(tHit(C.pos.x, -ex, 8), tHit(C.pos.y, -ey, 5));
  M1.pos.x = C.pos.x - s2 * ex; M1.pos.y = C.pos.y - s2 * ey; M2.pos.x = C.pos.x + t2 * ex; M2.pos.y = C.pos.y + t2 * ey;
  float cr = dx * ey - dy * ex; float cr2 = dx * (C.pos.y - A.pos.y) - dy * (C.pos.x - A.pos.x);
  if (abs(cr) > 0.3) { info = "Прямые **пересекаются**: у них ровно одна общая точка."; }
  if (abs(cr) <= 0.3) { if (abs(cr2) < 0.3) { info = "Прямые **совпадают**: все точки одной принадлежат другой."; } if (abs(cr2) >= 0.3) { info = "Прямые **параллельны**: общих точек нет, расстояние между ними постоянно."; } }
}
]
