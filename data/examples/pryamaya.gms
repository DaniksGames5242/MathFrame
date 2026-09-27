[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
new Point { name = "A"; pos = (-3, -1); text = true("A") }
new Point { name = "B"; pos = (2, 2); text = true("B") }
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "l"; pos = (L1, L2) }
string info = "";
Function tHit(p, d, half) { if (d > 0) { return (half - p) / d; } if (d < 0) { return (-half - p) / d; } return 1e9; }
Update {
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y;
  if (abs(dx) + abs(dy) < 0.05) { B.pos.x = A.pos.x + 1; dx = 1; }
  float t = min(tHit(A.pos.x, dx, 8), tHit(A.pos.y, dy, 5));
  float s = min(tHit(A.pos.x, -dx, 8), tHit(A.pos.y, -dy, 5));
  L1.pos.x = A.pos.x - s * dx; L1.pos.y = A.pos.y - s * dy;
  L2.pos.x = A.pos.x + t * dx; L2.pos.y = A.pos.y + t * dy;
  info = "**Прямая** — бесконечное в обе стороны множество точек: через любые две различные точки, A и B, проходит ровно одна прямая. Любая её точка делит её на два луча, а сама прямая не имеет ни начала, ни конца.";
}
]
