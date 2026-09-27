[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
new Point { name = "A"; pos = (-5, -2); text = true("A") } new Point { name = "B"; pos = (3, 2); text = true("B") } new Point { name = "C"; pos = (-2, 3); color = #f59e0b; text = true("C") }
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false } new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "M1"; pos = (0, 0); dynamic = false; collision = false } new Point { name = "M2"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "l"; pos = (L1, L2) } new Line { name = "m"; pos = (M1, M2); color = #f59e0b }
string info = "";
Function tHit(p, d, half) { if (d > 0) { return (half - p) / d; } if (d < 0) { return (-half - p) / d; } return 1e9; }
Update {
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; if (abs(dx) + abs(dy) < 0.05) { B.pos.x = A.pos.x + 1; dx = 1; }
  float t1 = min(tHit(A.pos.x, dx, 8), tHit(A.pos.y, dy, 5)); float s1 = min(tHit(A.pos.x, -dx, 8), tHit(A.pos.y, -dy, 5));
  L1.pos.x = A.pos.x - s1 * dx; L1.pos.y = A.pos.y - s1 * dy; L2.pos.x = A.pos.x + t1 * dx; L2.pos.y = A.pos.y + t1 * dy;
  float t2 = min(tHit(C.pos.x, dx, 8), tHit(C.pos.y, dy, 5)); float s2 = min(tHit(C.pos.x, -dx, 8), tHit(C.pos.y, -dy, 5));
  M1.pos.x = C.pos.x - s2 * dx; M1.pos.y = C.pos.y - s2 * dy; M2.pos.x = C.pos.x + t2 * dx; M2.pos.y = C.pos.y + t2 * dy;
  float len = sqrt(dx * dx + dy * dy); float dist = abs(dx * (C.pos.y - A.pos.y) - dy * (C.pos.x - A.pos.x)) / len;
  info = "**Параллельные прямые** не имеют общих точек: прямая через C всегда строится в том же направлении, что AB, и остаётся ей параллельной при любом движении точек. Расстояние между прямыми одинаково в любой точке и равно " + format(dist, 2) + ".";
}
]
