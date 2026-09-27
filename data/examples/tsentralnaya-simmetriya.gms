[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "A"; pos = (3, 2); pauseOnDrag = false }
new Point { name = "A1"; pos = (-3, -2); dynamic = false; collision = false; color = #22c55e }
new Line { name = "l"; pos = (A, A1); color = "transparent" }
Update {
  A1.pos.x = -A.pos.x; A1.pos.y = -A.pos.y;
  info = "**Центр симметрии** O — середина отрезка AA′: A(" + format(A.pos.x,1) + "; " + format(A.pos.y,1) + "), образ A′(" + format(A1.pos.x,1) + "; " + format(A1.pos.y,1) + ").\n\nO, A и A′ лежат на одной прямой, а |OA| = |OA′| = " + format(sqrt(A.pos.x*A.pos.x+A.pos.y*A.pos.y),2) + ".";
}
]
