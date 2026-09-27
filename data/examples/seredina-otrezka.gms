[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-5, -2); pauseOnDrag = false }
new Point { name = "B"; pos = (4, 3); pauseOnDrag = false }
new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "ab"; pos = (A, B) }
Update {
  M.pos.x = (A.pos.x + B.pos.x) / 2; M.pos.y = (A.pos.y + B.pos.y) / 2;
  info = "**Середина отрезка AB** — точка M, равноудалённая от концов A и B.\n\nA = (" + format(A.pos.x, 1) + "; " + format(A.pos.y, 1) + "), B = (" + format(B.pos.x, 1) + "; " + format(B.pos.y, 1) + "), M = ((xA + xB)/2; (yA + yB)/2) = (" + format(M.pos.x, 1) + "; " + format(M.pos.y, 1) + ").";
}
]
