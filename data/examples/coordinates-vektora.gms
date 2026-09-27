[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
new Point { name = "A"; pos = (-3, -2); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "B"; pos = (4, 3); pauseOnDrag = false; color = #f59e0b }
new Line { name = "ab"; pos = (A, B); color = #22c55e; thickness = 3; interact = false }
draw Vector { name = "vab"; edge = "ab"; pos = 1; color = #22c55e; thickness = 3 }
Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Update {
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y;
  info = "**Координаты вектора** AB равны разности координат конца и начала: AB = (" + num(dx) + "; " + num(dy) + ") при A(" + num(A.pos.x) + "; " + num(A.pos.y) + "), B(" + num(B.pos.x) + "; " + num(B.pos.y) + ").\n\n|AB| = √(" + format(dx, 1) + "² + " + format(dy, 1) + "²) ≈ " + format(sqrt(dx * dx + dy * dy), 2) + ".";
}
]
