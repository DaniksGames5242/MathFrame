[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
new Point { name = "A"; pos = (-4, -2); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "B"; pos = (5, 3); pauseOnDrag = false; color = #f59e0b }
new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; size = 0.4; color = #22c55e }
new Line { name = "ab"; pos = (A, B); color = #22c55e; thickness = 3; interact = false }
Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Update {
  M.pos.x = (A.pos.x + B.pos.x) / 2; M.pos.y = (A.pos.y + B.pos.y) / 2;
  info = "**Середина отрезка** AB — точка M с координатами, равными полусумме координат концов: M = ((x₁ + x₂)/2; (y₁ + y₂)/2).\n\nA(" + num(A.pos.x) + "; " + num(A.pos.y) + "), B(" + num(B.pos.x) + "; " + num(B.pos.y) + "), M(" + num(M.pos.x) + "; " + num(M.pos.y) + ").";
}
]
